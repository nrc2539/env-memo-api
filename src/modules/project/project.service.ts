import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { EmailService } from '../email/email.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { InviteMemberDto } from './dto/invite-member.dto.js';
import { generateToken } from '../../../utils/generate-token.util';
import {
  getPagination,
  formatPaginatedResponse,
} from '../../../utils/pagination/pagination.util.js';
import { PaginationDto } from '../../../utils/pagination/dto/pagination.dto.js';
import { RoleEnum } from '../../../utils/enums/role.enum.js';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(userId: number, dto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        members: {
          create: { userId, role: 'OWNER' },
        },
      },
    });

    return project;
  }

  async findAll(userId: number, paginationDto: PaginationDto, search?: string) {
    const where: Record<string, unknown> = { userId, deletedAt: null };

    if (search) {
      where.project = { name: { contains: search, mode: 'insensitive' } };
    }

    const total = await this.prisma.projectMember.count({ where });

    const { skip, take } = getPagination(paginationDto);
    const memberships = await this.prisma.projectMember.findMany({
      where,
      include: { project: true },
      skip,
      take,
    });

    const data = memberships.map((m) => ({
      ...m.project,
      role: m.role,
    }));
    return formatPaginatedResponse(data, total, paginationDto);
  }

  async findOne(projectId: number, userId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = project.members.find((m) => m.userId === userId);

    return {
      ...project,
      role: membership?.role ?? null,
    };
  }

  async update(projectId: number, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async remove(projectId: number) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.$transaction([
      this.prisma.project.update({
        where: { id: projectId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.envGroup.updateMany({
        where: { projectId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.projectMember.updateMany({
        where: { projectId },
        data: { deletedAt: new Date() },
      }),
    ]);

    return { message: 'Project deleted successfully' };
  }

  async getMembers(
    projectId: number,
    userId: number,
    paginationDto: PaginationDto,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const membership = await this.prisma.projectMember.findFirst({
      where: { userId, projectId, deletedAt: null },
    });

    if (!membership) {
      throw new ForbiddenException('You are not a member of this project');
    }

    const where = { projectId, deletedAt: null };
    const total = await this.prisma.projectMember.count({ where });

    const { skip, take } = getPagination(paginationDto);
    const data = await this.prisma.projectMember.findMany({
      where,
      include: { user: { select: { id: true, email: true, name: true } } },
      skip,
      take,
    });

    return formatPaginatedResponse(data, total, paginationDto);
  }

  async removeMember(projectId: number, memberUserId: number) {
    const member = await this.prisma.projectMember.findFirst({
      where: {
        userId: memberUserId,
        projectId,
        deletedAt: null,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'OWNER') {
      throw new ConflictException('Cannot remove the project owner');
    }

    await this.prisma.projectMember.update({
      where: { id: member.id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Member removed successfully' };
  }

  async invite(projectId: number, invitedById: number, dto: InviteMemberDto) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      const existingInvitation = await this.prisma.invitation.findFirst({
        where: {
          invitedUserId: existingUser.id,
          projectId,
          status: 'PENDING',
        },
      });

      if (existingInvitation) {
        throw new ConflictException(
          'A pending invitation already exists for this user.',
        );
      }

      const existingMember = await this.prisma.projectMember.findFirst({
        where: {
          userId: existingUser.id,
          projectId,
        },
      });

      if (existingMember) {
        if (existingMember.deletedAt === null) {
          throw new ConflictException(
            'User is already a member of this project',
          );
        }

        await this.prisma.projectMember.update({
          where: { id: existingMember.id },
          data: { deletedAt: null, role: dto.role },
        });

        return { message: 'User added to project successfully' };
      }

      if (existingUser.password === null) {
        await this.createInvitation({
          email: dto.email,
          role: dto.role,
          invitedUserId: existingUser.id,
          projectId,
          invitedById,
        });
        return { message: 'Invitation sent successfully' };
      }

      await this.prisma.projectMember.create({
        data: {
          userId: existingUser.id,
          projectId,
          role: dto.role,
        },
      });

      return { message: 'User added to project successfully' };
    }

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: null,
      },
    });

    await this.createInvitation({
      email: dto.email,
      role: dto.role,
      invitedUserId: newUser.id,
      projectId,
      invitedById,
    });

    return { message: 'Invitation sent successfully' };
  }

  async resendInvite(projectId: number, invitationId: number) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, projectId, status: 'PENDING' },
      include: { invitedUser: true },
    });

    if (!invitation || !invitation.invitedUser) {
      throw new NotFoundException('Invitation not found');
    }

    const setupPasswordToken = generateToken();

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { token: setupPasswordToken },
    });

    await this.emailService.sendSetupPasswordEmail(
      invitation.email,
      setupPasswordToken,
    );

    return { message: 'Invitation re-sent successfully' };
  }

  async removeInvite(projectId: number, invitationId: number) {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, projectId, status: 'PENDING' },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Invitation removed successfully' };
  }

  private async createInvitation(data: {
    email: string;
    role: RoleEnum;
    invitedUserId: number;
    projectId: number;
    invitedById: number;
  }) {
    const setupPasswordToken = generateToken();

    await this.prisma.invitation.create({
      data: {
        ...data,
        token: setupPasswordToken,
      },
    });

    await this.emailService.sendSetupPasswordEmail(
      data.email,
      setupPasswordToken,
    );
  }

  async getInvitations(
    projectId: number,
    paginationDto: PaginationDto,
    status?: string,
  ) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const where: Record<string, unknown> = { projectId };

    if (status) {
      where.status = status;
    }

    const total = await this.prisma.invitation.count({ where });

    const { skip, take } = getPagination(paginationDto);
    const data = await this.prisma.invitation.findMany({
      where,
      include: {
        invitedBy: { select: { id: true, email: true, name: true } },
        invitedUser: { select: { id: true, email: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });

    return formatPaginatedResponse(data, total, paginationDto);
  }
}

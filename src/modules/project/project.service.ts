import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { InviteMemberDto } from './dto/invite-member.dto.js';
import { randomBytes } from 'node:crypto';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
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

  async findAll(userId: string) {
    const memberships = await this.prisma.projectMember.findMany({
      where: { userId },
      include: { project: true },
    });

    return memberships.map((m) => m.project);
  }

  async findOne(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        members: {
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(projectId: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async remove(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.delete({ where: { id: projectId } });

    return { message: 'Project deleted successfully' };
  }

  async getMembers(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { id: true, email: true } } },
    });
  }

  async removeMember(projectId: string, memberUserId: string) {
    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: memberUserId, projectId },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'OWNER') {
      throw new ConflictException('Cannot remove the project owner');
    }

    await this.prisma.projectMember.delete({
      where: { id: member.id },
    });

    return { message: 'Member removed successfully' };
  }

  async invite(projectId: string, invitedById: string, dto: InviteMemberDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      const alreadyMember = await this.prisma.projectMember.findUnique({
        where: {
          userId_projectId: { userId: existingUser.id, projectId },
        },
      });

      if (alreadyMember) {
        throw new ConflictException('User is already a member of this project');
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

    const setupPasswordToken = randomBytes(32).toString('hex');

    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: null,
        setupPasswordToken,
      },
    });

    await this.prisma.invitation.create({
      data: {
        email: dto.email,
        role: dto.role,
        token: setupPasswordToken,
        projectId,
        invitedById,
        invitedUserId: newUser.id,
      },
    });

    console.log(
      `[MOCK EMAIL] Invitation sent to ${dto.email} with token: ${setupPasswordToken}`,
    );

    return { message: 'Invitation sent successfully' };
  }

  async getInvitations(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.invitation.findMany({
      where: { projectId },
      include: {
        invitedBy: { select: { id: true, email: true } },
        invitedUser: { select: { id: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

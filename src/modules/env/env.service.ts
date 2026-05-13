import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateEnvGroupDto } from './dto/create-env-group.dto.js';
import { UpdateEnvGroupDto } from './dto/update-env-group.dto.js';
import { CreateEnvVariableDto } from './dto/create-env-variable.dto.js';
import { UpdateEnvVariableDto } from './dto/update-env-variable.dto.js';
import {
  getPagination,
  formatPaginatedResponse,
} from '../../../utils/pagination/pagination.util.js';
import { PaginationDto } from '../../../utils/pagination/dto/pagiantion.dto.js';

@Injectable()
export class EnvService {
  constructor(private prisma: PrismaService) {}

  async createGroup(projectId: number, dto: CreateEnvGroupDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.prisma.envGroup.create({
      data: {
        name: dto.name,
        projectId,
      },
    });
  }

  async findGroups(projectId: number, paginationDto: PaginationDto) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const where = { projectId };
    const total = await this.prisma.envGroup.count({ where });

    const { skip, take } = getPagination(
      paginationDto.page,
      paginationDto.limitPerPage,
    );
    const data = await this.prisma.envGroup.findMany({
      where,
      include: { variables: true },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });

    return formatPaginatedResponse(data, total, paginationDto);
  }

  async findGroup(envGroupId: string) {
    const group = await this.prisma.envGroup.findUnique({
      where: { id: envGroupId },
      include: { variables: true },
    });

    if (!group) {
      throw new NotFoundException('Environment group not found');
    }

    return group;
  }

  async updateGroup(envGroupId: string, dto: UpdateEnvGroupDto) {
    const group = await this.prisma.envGroup.findUnique({
      where: { id: envGroupId },
    });

    if (!group) {
      throw new NotFoundException('Environment group not found');
    }

    return this.prisma.envGroup.update({
      where: { id: envGroupId },
      data: dto,
      include: { variables: true },
    });
  }

  async removeGroup(envGroupId: string) {
    const group = await this.prisma.envGroup.findUnique({
      where: { id: envGroupId },
    });

    if (!group) {
      throw new NotFoundException('Environment group not found');
    }

    await this.prisma.envGroup.delete({ where: { id: envGroupId } });

    return { message: 'Environment group deleted successfully' };
  }

  async createVariable(envGroupId: string, dto: CreateEnvVariableDto) {
    const group = await this.prisma.envGroup.findUnique({
      where: { id: envGroupId },
    });

    if (!group) {
      throw new NotFoundException('Environment group not found');
    }

    return this.prisma.envVariable.create({
      data: {
        key: dto.key,
        value: dto.value,
        envGroupId,
      },
    });
  }

  async updateVariable(variableId: string, dto: UpdateEnvVariableDto) {
    const variable = await this.prisma.envVariable.findUnique({
      where: { id: variableId },
    });

    if (!variable) {
      throw new NotFoundException('Environment variable not found');
    }

    return this.prisma.envVariable.update({
      where: { id: variableId },
      data: dto,
    });
  }

  async removeVariable(variableId: string) {
    const variable = await this.prisma.envVariable.findUnique({
      where: { id: variableId },
    });

    if (!variable) {
      throw new NotFoundException('Environment variable not found');
    }

    await this.prisma.envVariable.delete({ where: { id: variableId } });

    return { message: 'Environment variable deleted successfully' };
  }
}

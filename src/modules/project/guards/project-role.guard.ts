import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RoleEnum } from '../../../../utils/enums/role.enum.js';
import { PROJECT_ROLES_KEY } from '../decorators/require-project-role.decorator.js';

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.get<RoleEnum[]>(
      PROJECT_ROLES_KEY,
      context.getHandler(),
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as { id: number } | undefined;
    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    const params = request.params as Record<string, string>;
    const projectIdParam = params.projectId ?? params.id;
    if (!projectIdParam) {
      throw new ForbiddenException('Project ID not found');
    }

    const projectId = +projectIdParam;

    const member = await this.prisma.projectMember.findUnique({
      where: {
        userId_projectId: { userId: user.id, projectId },
      },
    });

    if (!member) {
      throw new ForbiddenException('Not a member of this project');
    }

    if (!requiredRoles.includes(member.role as RoleEnum)) {
      throw new ForbiddenException(
        `Requires one of roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}

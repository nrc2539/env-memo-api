import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { EnvService } from './env.service.js';
import { CreateEnvGroupDto } from './dto/create-env-group.dto.js';
import { UpdateEnvGroupDto } from './dto/update-env-group.dto.js';
import { CreateEnvVariableDto } from './dto/create-env-variable.dto.js';
import { UpdateEnvVariableDto } from './dto/update-env-variable.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { RequireProjectRole } from '../project/decorators/require-project-role.decorator.js';
import { ProjectRoleGuard } from '../project/guards/project-role.guard.js';
import { RoleEnum } from '../../../utils/enums/role.enum.js';

@UseGuards(JwtAuthGuard)
@Controller()
export class EnvController {
  constructor(private envService: EnvService) {}

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Post('projects/:projectId/env-groups')
  createGroup(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateEnvGroupDto,
  ) {
    return this.envService.createGroup(projectId, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.VIEWER, RoleEnum.EDITOR, RoleEnum.OWNER)
  @Get('projects/:projectId/env-groups')
  findGroups(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.envService.findGroups(projectId);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.VIEWER, RoleEnum.EDITOR, RoleEnum.OWNER)
  @Get('projects/:projectId/env-groups/:id')
  findGroup(@Param('id') id: string) {
    return this.envService.findGroup(id);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Patch('projects/:projectId/env-groups/:id')
  updateGroup(@Param('id') id: string, @Body() dto: UpdateEnvGroupDto) {
    return this.envService.updateGroup(id, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Delete('projects/:projectId/env-groups/:id')
  removeGroup(@Param('id') id: string) {
    return this.envService.removeGroup(id);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.EDITOR, RoleEnum.OWNER)
  @Post('projects/:projectId/env-groups/:id/variables')
  createVariable(@Param('id') id: string, @Body() dto: CreateEnvVariableDto) {
    return this.envService.createVariable(id, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.EDITOR, RoleEnum.OWNER)
  @Patch('projects/:projectId/env-groups/:groupId/variables/:variableId')
  updateVariable(
    @Param('variableId') variableId: string,
    @Body() dto: UpdateEnvVariableDto,
  ) {
    return this.envService.updateVariable(variableId, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.EDITOR, RoleEnum.OWNER)
  @Delete('projects/:projectId/env-groups/:groupId/variables/:variableId')
  removeVariable(@Param('variableId') variableId: string) {
    return this.envService.removeVariable(variableId);
  }
}

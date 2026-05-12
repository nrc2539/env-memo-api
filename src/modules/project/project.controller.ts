import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ProjectService } from './project.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { InviteMemberDto } from './dto/invite-member.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequireProjectRole } from './decorators/require-project-role.decorator.js';
import { ProjectRoleGuard } from './guards/project-role.guard.js';
import { RoleEnum } from '../../../utils/enums/role.enum.js';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateProjectDto) {
    return this.projectService.create(user.id, dto);
  }

  @Get()
  findAll(@CurrentUser() user: { id: string }) {
    return this.projectService.findAll(user.id);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.VIEWER, RoleEnum.EDITOR, RoleEnum.OWNER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectService.findOne(id);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectService.update(id, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.VIEWER, RoleEnum.EDITOR, RoleEnum.OWNER)
  @Get(':id/members')
  getMembers(@Param('id') id: string) {
    return this.projectService.getMembers(id);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.projectService.removeMember(id, userId);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Post(':id/invitations')
  invite(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() dto: InviteMemberDto,
  ) {
    return this.projectService.invite(id, user.id, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Get(':id/invitations')
  getInvitations(@Param('id') id: string) {
    return this.projectService.getInvitations(id);
  }
}

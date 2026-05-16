import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ProjectService } from './project.service.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';
import { InviteMemberDto } from './dto/invite-member.dto.js';
import { GetInvitationsDto } from './dto/get-invitations.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { RequireProjectRole } from './decorators/require-project-role.decorator.js';
import { ProjectRoleGuard } from './guards/project-role.guard.js';
import { RoleEnum } from '../../../utils/enums/role.enum.js';
import { PaginationDto } from '../../../utils/pagination/dto/pagination.dto.js';

@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private projectService: ProjectService) {}

  @Post()
  create(@CurrentUser() user: { id: number }, @Body() dto: CreateProjectDto) {
    return this.projectService.create(user.id, dto);
  }

  @Get()
  findAll(
    @CurrentUser() user: { id: number },
    @Query() paginationDto: PaginationDto,
  ) {
    return this.projectService.findAll(user.id, paginationDto);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.VIEWER, RoleEnum.EDITOR, RoleEnum.OWNER)
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
  ) {
    return this.projectService.findOne(id, user.id);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProjectDto) {
    return this.projectService.update(id, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.projectService.remove(id);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.VIEWER, RoleEnum.EDITOR, RoleEnum.OWNER)
  @Get(':id/members')
  getMembers(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
    @Query() paginationDto: PaginationDto,
  ) {
    return this.projectService.getMembers(id, user.id, paginationDto);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Delete(':id/members/:userId')
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.projectService.removeMember(id, userId);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Post(':id/invitations')
  invite(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { id: number },
    @Body() dto: InviteMemberDto,
  ) {
    return this.projectService.invite(id, user.id, dto);
  }

  @UseGuards(ProjectRoleGuard)
  @RequireProjectRole(RoleEnum.OWNER)
  @Get(':id/invitations')
  getInvitations(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetInvitationsDto,
  ) {
    return this.projectService.getInvitations(id, query, query.status);
  }
}

import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller.js';
import { ProjectService } from './project.service.js';
import { ProjectRoleGuard } from './guards/project-role.guard.js';

@Module({
  controllers: [ProjectController],
  providers: [ProjectService, ProjectRoleGuard],
  exports: [ProjectService, ProjectRoleGuard],
})
export class ProjectModule {}

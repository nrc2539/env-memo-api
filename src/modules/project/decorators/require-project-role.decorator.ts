import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../../../../utils/enums/role.enum.js';

export const PROJECT_ROLES_KEY = 'PROJECT_ROLES';
export const RequireProjectRole = (...roles: RoleEnum[]) =>
  SetMetadata(PROJECT_ROLES_KEY, roles);

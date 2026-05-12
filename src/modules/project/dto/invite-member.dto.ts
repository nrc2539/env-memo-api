import { IsEmail, IsEnum } from 'class-validator';
import { RoleEnum } from '../../../../utils/enums/role.enum.js';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(RoleEnum)
  role: RoleEnum;
}

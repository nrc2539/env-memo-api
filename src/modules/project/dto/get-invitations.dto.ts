import { IsOptional, IsEnum } from 'class-validator';
import { PaginationDto } from '../../../../utils/pagination/dto/pagination.dto.js';
import { InvitationStatusEnum } from '../../../../utils/enums/invitation-status.enum.js';

export class GetInvitationsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(InvitationStatusEnum)
  status?: InvitationStatusEnum;
}

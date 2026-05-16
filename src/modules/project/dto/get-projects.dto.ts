import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../../utils/pagination/dto/pagination.dto.js';

export class GetProjectsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}

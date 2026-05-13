import { IsOptional, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limitPerPage?: number = 10;

  @IsOptional()
  @Transform(({ value }) => value === 'true') // Converts string "true" from URL to boolean
  all?: boolean = false;
}

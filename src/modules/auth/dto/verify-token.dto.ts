import { IsString, IsOptional, IsIn } from 'class-validator';

export class VerifyTokenDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  @IsIn(['reset', 'setup'])
  type?: string;
}

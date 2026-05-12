import { IsString } from 'class-validator';

export class UpdateEnvVariableDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

import { IsString } from 'class-validator';

export class CreateEnvVariableDto {
  @IsString()
  key: string;

  @IsString()
  value: string;
}

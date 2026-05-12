import { IsString } from 'class-validator';

export class CreateEnvGroupDto {
  @IsString()
  name: string;
}

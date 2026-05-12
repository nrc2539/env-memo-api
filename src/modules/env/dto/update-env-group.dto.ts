import { IsString } from 'class-validator';

export class UpdateEnvGroupDto {
  @IsString()
  name: string;
}

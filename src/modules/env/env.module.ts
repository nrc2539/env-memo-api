import { Module } from '@nestjs/common';
import { EnvController } from './env.controller.js';
import { EnvService } from './env.service.js';

@Module({
  controllers: [EnvController],
  providers: [EnvService],
  exports: [EnvService],
})
export class EnvModule {}

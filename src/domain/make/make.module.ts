import { Module } from '@nestjs/common';
import { MakeService } from './make.service';
import { MakeRepository } from './make.repository';

@Module({
  providers: [MakeService, MakeRepository],
  exports: [MakeService],
})
export class MakeModule {}

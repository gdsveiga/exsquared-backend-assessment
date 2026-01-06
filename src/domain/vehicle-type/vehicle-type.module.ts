import { Module } from '@nestjs/common';
import { VehicleTypeService } from './vehicle-type.service';
import { VehicleTypeRepository } from './vehicle-type.repository';

@Module({
  providers: [VehicleTypeService, VehicleTypeRepository],
  exports: [VehicleTypeService],
})
export class VehicleTypeModule {}

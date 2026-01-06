import { Injectable } from '@nestjs/common';
import {
  VehicleTypeRepository,
  FindManyOptions,
  SearchOptions,
} from './vehicle-type.repository';

@Injectable()
export class VehicleTypeService {
  constructor(private readonly vehicleTypeRepository: VehicleTypeRepository) {}

  findAll(options: FindManyOptions = {}) {
    return this.vehicleTypeRepository.findMany(options);
  }

  findById(id: number) {
    return this.vehicleTypeRepository.findById(id);
  }

  findByMakeId(makeId: number) {
    return this.vehicleTypeRepository.findByMakeId(makeId);
  }

  searchByName(options: SearchOptions) {
    return this.vehicleTypeRepository.searchByName(options);
  }

  count() {
    return this.vehicleTypeRepository.count();
  }
}

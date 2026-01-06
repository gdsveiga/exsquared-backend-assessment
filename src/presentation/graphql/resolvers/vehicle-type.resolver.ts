import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { VehicleTypeObject } from '../types/vehicle-type.type';
import { VehicleTypeService } from '../../../domain/vehicle-type/vehicle-type.service';

@Resolver(() => VehicleTypeObject)
export class VehicleTypeResolver {
  constructor(private readonly vehicleTypeService: VehicleTypeService) {}

  @Query(() => [VehicleTypeObject], { name: 'vehicleTypes' })
  async getVehicleTypes(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.vehicleTypeService.findAll({ skip, take });
  }

  @Query(() => VehicleTypeObject, { name: 'vehicleType', nullable: true })
  async getVehicleType(@Args('id', { type: () => Int }) id: number) {
    const type = await this.vehicleTypeService.findById(id);
    if (!type) {
      throw new NotFoundException(`VehicleType with id ${id} not found`);
    }
    return type;
  }

  @Query(() => [VehicleTypeObject], { name: 'vehicleTypesByMakeId' })
  async getVehicleTypesByMakeId(
    @Args('makeId', { type: () => Int }) makeId: number,
  ) {
    return this.vehicleTypeService.findByMakeId(makeId);
  }

  @Query(() => [VehicleTypeObject], { name: 'searchVehicleTypes' })
  async searchVehicleTypes(
    @Args('name') name: string,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.vehicleTypeService.searchByName({ name, skip, take });
  }

  @Query(() => Int, { name: 'vehicleTypesCount' })
  async getVehicleTypesCount() {
    return this.vehicleTypeService.count();
  }
}

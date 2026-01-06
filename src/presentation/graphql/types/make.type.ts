import { ObjectType, Field, Int } from '@nestjs/graphql';
import { VehicleTypeObject } from './vehicle-type.type';

@ObjectType('Make')
export class MakeObject {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  makeId!: number;

  @Field()
  makeName!: string;

  @Field(() => [VehicleTypeObject], { nullable: true })
  vehicleTypes?: VehicleTypeObject[];

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

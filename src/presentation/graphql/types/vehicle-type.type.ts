import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType('VehicleType')
export class VehicleTypeObject {
  @Field(() => Int)
  id!: number;

  @Field(() => Int)
  typeId!: number;

  @Field()
  typeName!: string;

  @Field(() => Int)
  makeId!: number;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

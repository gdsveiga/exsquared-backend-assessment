import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { MakeObject } from '../types/make.type';
import { MakeService } from '../../../domain/make/make.service';

@Resolver(() => MakeObject)
export class MakeResolver {
  constructor(private readonly makeService: MakeService) {}

  @Query(() => [MakeObject], { name: 'makes' })
  async getMakes(
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.makeService.findAll({ skip, take });
  }

  @Query(() => MakeObject, { name: 'make', nullable: true })
  async getMake(@Args('id', { type: () => Int }) id: number) {
    const make = await this.makeService.findById(id);
    if (!make) {
      throw new NotFoundException(`Make with id ${id} not found`);
    }
    return make;
  }

  @Query(() => MakeObject, { name: 'makeByMakeId', nullable: true })
  async getMakeByMakeId(@Args('makeId', { type: () => Int }) makeId: number) {
    const make = await this.makeService.findByMakeId(makeId);
    if (!make) {
      throw new NotFoundException(`Make with makeId ${makeId} not found`);
    }
    return make;
  }

  @Query(() => [MakeObject], { name: 'searchMakes' })
  async searchMakes(
    @Args('name') name: string,
    @Args('skip', { type: () => Int, nullable: true }) skip?: number,
    @Args('take', { type: () => Int, nullable: true }) take?: number,
  ) {
    return this.makeService.searchByName({ name, skip, take });
  }

  @Query(() => Int, { name: 'makesCount' })
  async getMakesCount() {
    return this.makeService.count();
  }
}

import { Injectable } from '@nestjs/common';
import {
  MakeRepository,
  FindManyOptions,
  SearchOptions,
} from './make.repository';

@Injectable()
export class MakeService {
  constructor(private readonly makeRepository: MakeRepository) {}

  findAll(options: FindManyOptions = {}) {
    return this.makeRepository.findMany(options);
  }

  findById(id: number) {
    return this.makeRepository.findById(id);
  }

  findByMakeId(makeId: number) {
    return this.makeRepository.findByMakeId(makeId);
  }

  searchByName(options: SearchOptions) {
    return this.makeRepository.searchByName(options);
  }

  count() {
    return this.makeRepository.count();
  }
}

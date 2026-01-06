import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface FindManyOptions {
  skip?: number;
  take?: number;
}

export interface SearchOptions extends FindManyOptions {
  name: string;
}

@Injectable()
export class MakeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(options: FindManyOptions = {}) {
    return this.prisma.make.findMany({
      skip: options.skip,
      take: options.take,
      include: { vehicleTypes: true },
      orderBy: { makeName: 'asc' },
    });
  }

  findById(id: number) {
    return this.prisma.make.findUnique({
      where: { id },
      include: { vehicleTypes: true },
    });
  }

  findByMakeId(makeId: number) {
    return this.prisma.make.findUnique({
      where: { makeId },
      include: { vehicleTypes: true },
    });
  }

  searchByName(options: SearchOptions) {
    return this.prisma.make.findMany({
      where: {
        makeName: {
          contains: options.name,
          mode: 'insensitive',
        },
      },
      skip: options.skip,
      take: options.take,
      include: { vehicleTypes: true },
      orderBy: { makeName: 'asc' },
    });
  }

  count() {
    return this.prisma.make.count();
  }
}

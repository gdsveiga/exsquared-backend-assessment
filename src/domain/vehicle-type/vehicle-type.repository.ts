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
export class VehicleTypeRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(options: FindManyOptions = {}) {
    return this.prisma.vehicleType.findMany({
      skip: options.skip,
      take: options.take,
      include: { make: true },
      orderBy: { typeName: 'asc' },
    });
  }

  findById(id: number) {
    return this.prisma.vehicleType.findUnique({
      where: { id },
      include: { make: true },
    });
  }

  findByMakeId(makeId: number) {
    return this.prisma.vehicleType.findMany({
      where: { makeId },
      include: { make: true },
      orderBy: { typeName: 'asc' },
    });
  }

  searchByName(options: SearchOptions) {
    return this.prisma.vehicleType.findMany({
      where: {
        typeName: {
          contains: options.name,
          mode: 'insensitive',
        },
      },
      skip: options.skip,
      take: options.take,
      include: { make: true },
      orderBy: { typeName: 'asc' },
    });
  }

  count() {
    return this.prisma.vehicleType.count();
  }
}

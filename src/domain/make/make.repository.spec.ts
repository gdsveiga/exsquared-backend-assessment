import { Test, TestingModule } from '@nestjs/testing';
import { MakeRepository } from './make.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

describe('MakeRepository', () => {
  let repository: MakeRepository;
  let prisma: {
    make: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
    };
  };

  const now = new Date();
  const mockMakes = [
    {
      id: 1,
      makeId: 440,
      makeName: 'Aston Martin',
      vehicleTypes: [
        {
          id: 1,
          typeId: 1,
          typeName: 'Passenger Car',
          makeId: 1,
          createdAt: now,
          updatedAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      makeId: 441,
      makeName: 'BMW',
      vehicleTypes: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  beforeEach(async () => {
    prisma = {
      make: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [MakeRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<MakeRepository>(MakeRepository);
  });

  describe('findMany', () => {
    it('should return all makes with vehicle types', async () => {
      prisma.make.findMany.mockResolvedValue(mockMakes);

      const result = await repository.findMany();

      expect(result).toEqual(mockMakes);
      expect(prisma.make.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        include: { vehicleTypes: true },
        orderBy: { makeName: 'asc' },
      });
    });

    it('should apply pagination', async () => {
      prisma.make.findMany.mockResolvedValue([mockMakes[0]]);

      const result = await repository.findMany({ skip: 0, take: 1 });

      expect(result).toHaveLength(1);
      expect(prisma.make.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 1,
        include: { vehicleTypes: true },
        orderBy: { makeName: 'asc' },
      });
    });

    it('should return empty array when no makes exist', async () => {
      prisma.make.findMany.mockResolvedValue([]);

      const result = await repository.findMany();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return make by id with vehicle types', async () => {
      prisma.make.findUnique.mockResolvedValue(mockMakes[0]);

      const result = await repository.findById(1);

      expect(result).toEqual(mockMakes[0]);
      expect(prisma.make.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { vehicleTypes: true },
      });
    });

    it('should return null when make not found', async () => {
      prisma.make.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByMakeId', () => {
    it('should return make by makeId with vehicle types', async () => {
      prisma.make.findUnique.mockResolvedValue(mockMakes[0]);

      const result = await repository.findByMakeId(440);

      expect(result).toEqual(mockMakes[0]);
      expect(prisma.make.findUnique).toHaveBeenCalledWith({
        where: { makeId: 440 },
        include: { vehicleTypes: true },
      });
    });

    it('should return null when make not found', async () => {
      prisma.make.findUnique.mockResolvedValue(null);

      const result = await repository.findByMakeId(999);

      expect(result).toBeNull();
    });
  });

  describe('searchByName', () => {
    it('should search makes case-insensitively', async () => {
      prisma.make.findMany.mockResolvedValue([mockMakes[0]]);

      const result = await repository.searchByName({ name: 'aston' });

      expect(result).toEqual([mockMakes[0]]);
      expect(prisma.make.findMany).toHaveBeenCalledWith({
        where: {
          makeName: {
            contains: 'aston',
            mode: 'insensitive',
          },
        },
        skip: undefined,
        take: undefined,
        include: { vehicleTypes: true },
        orderBy: { makeName: 'asc' },
      });
    });

    it('should apply pagination to search', async () => {
      prisma.make.findMany.mockResolvedValue(mockMakes);

      const result = await repository.searchByName({
        name: 'A',
        skip: 0,
        take: 10,
      });

      expect(result).toEqual(mockMakes);
      expect(prisma.make.findMany).toHaveBeenCalledWith({
        where: {
          makeName: {
            contains: 'A',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 10,
        include: { vehicleTypes: true },
        orderBy: { makeName: 'asc' },
      });
    });

    it('should return empty array when no matches', async () => {
      prisma.make.findMany.mockResolvedValue([]);

      const result = await repository.searchByName({ name: 'NonExistent' });

      expect(result).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return total count', async () => {
      prisma.make.count.mockResolvedValue(100);

      const result = await repository.count();

      expect(result).toBe(100);
      expect(prisma.make.count).toHaveBeenCalled();
    });

    it('should return zero when no makes exist', async () => {
      prisma.make.count.mockResolvedValue(0);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });
});

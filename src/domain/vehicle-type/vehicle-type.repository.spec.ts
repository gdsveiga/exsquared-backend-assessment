import { Test, TestingModule } from '@nestjs/testing';
import { VehicleTypeRepository } from './vehicle-type.repository';
import { PrismaService } from '../../infrastructure/database/prisma.service';

describe('VehicleTypeRepository', () => {
  let repository: VehicleTypeRepository;
  let prisma: {
    vehicleType: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
    };
  };

  const now = new Date();
  const mockVehicleTypes = [
    {
      id: 1,
      typeId: 1,
      typeName: 'Passenger Car',
      makeId: 440,
      make: {
        id: 1,
        makeId: 440,
        makeName: 'Aston Martin',
        createdAt: now,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      typeId: 2,
      typeName: 'Motorcycle',
      makeId: 440,
      make: {
        id: 1,
        makeId: 440,
        makeName: 'Aston Martin',
        createdAt: now,
        updatedAt: now,
      },
      createdAt: now,
      updatedAt: now,
    },
  ];

  beforeEach(async () => {
    prisma = {
      vehicleType: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleTypeRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<VehicleTypeRepository>(VehicleTypeRepository);
  });

  describe('findMany', () => {
    it('should return all vehicle types with make relation', async () => {
      prisma.vehicleType.findMany.mockResolvedValue(mockVehicleTypes);

      const result = await repository.findMany();

      expect(result).toEqual(mockVehicleTypes);
      expect(prisma.vehicleType.findMany).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
        include: { make: true },
        orderBy: { typeName: 'asc' },
      });
    });

    it('should apply pagination', async () => {
      prisma.vehicleType.findMany.mockResolvedValue([mockVehicleTypes[0]]);

      const result = await repository.findMany({ skip: 0, take: 1 });

      expect(result).toHaveLength(1);
      expect(prisma.vehicleType.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 1,
        include: { make: true },
        orderBy: { typeName: 'asc' },
      });
    });

    it('should return empty array when no vehicle types exist', async () => {
      prisma.vehicleType.findMany.mockResolvedValue([]);

      const result = await repository.findMany();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return vehicle type by id with make relation', async () => {
      prisma.vehicleType.findUnique.mockResolvedValue(mockVehicleTypes[0]);

      const result = await repository.findById(1);

      expect(result).toEqual(mockVehicleTypes[0]);
      expect(prisma.vehicleType.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { make: true },
      });
    });

    it('should return null when vehicle type not found', async () => {
      prisma.vehicleType.findUnique.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByMakeId', () => {
    it('should return vehicle types by makeId with make relation', async () => {
      prisma.vehicleType.findMany.mockResolvedValue(mockVehicleTypes);

      const result = await repository.findByMakeId(440);

      expect(result).toEqual(mockVehicleTypes);
      expect(prisma.vehicleType.findMany).toHaveBeenCalledWith({
        where: { makeId: 440 },
        include: { make: true },
        orderBy: { typeName: 'asc' },
      });
    });

    it('should return empty array when no vehicle types found for make', async () => {
      prisma.vehicleType.findMany.mockResolvedValue([]);

      const result = await repository.findByMakeId(999);

      expect(result).toEqual([]);
    });
  });

  describe('searchByName', () => {
    it('should search vehicle types case-insensitively', async () => {
      prisma.vehicleType.findMany.mockResolvedValue([mockVehicleTypes[0]]);

      const result = await repository.searchByName({ name: 'passenger' });

      expect(result).toEqual([mockVehicleTypes[0]]);
      expect(prisma.vehicleType.findMany).toHaveBeenCalledWith({
        where: {
          typeName: {
            contains: 'passenger',
            mode: 'insensitive',
          },
        },
        skip: undefined,
        take: undefined,
        include: { make: true },
        orderBy: { typeName: 'asc' },
      });
    });

    it('should apply pagination to search', async () => {
      prisma.vehicleType.findMany.mockResolvedValue(mockVehicleTypes);

      const result = await repository.searchByName({
        name: 'Car',
        skip: 0,
        take: 10,
      });

      expect(result).toEqual(mockVehicleTypes);
      expect(prisma.vehicleType.findMany).toHaveBeenCalledWith({
        where: {
          typeName: {
            contains: 'Car',
            mode: 'insensitive',
          },
        },
        skip: 0,
        take: 10,
        include: { make: true },
        orderBy: { typeName: 'asc' },
      });
    });

    it('should return empty array when no matches', async () => {
      prisma.vehicleType.findMany.mockResolvedValue([]);

      const result = await repository.searchByName({ name: 'NonExistent' });

      expect(result).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return total count', async () => {
      prisma.vehicleType.count.mockResolvedValue(50);

      const result = await repository.count();

      expect(result).toBe(50);
      expect(prisma.vehicleType.count).toHaveBeenCalled();
    });

    it('should return zero when no vehicle types exist', async () => {
      prisma.vehicleType.count.mockResolvedValue(0);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VehicleTypeResolver } from './vehicle-type.resolver';
import { VehicleTypeService } from '../../../domain/vehicle-type/vehicle-type.service';

describe('VehicleTypeResolver', () => {
  let resolver: VehicleTypeResolver;
  let service: jest.Mocked<VehicleTypeService>;

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
    const mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByMakeId: jest.fn(),
      searchByName: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleTypeResolver,
        { provide: VehicleTypeService, useValue: mockService },
      ],
    }).compile();

    resolver = module.get<VehicleTypeResolver>(VehicleTypeResolver);
    service = module.get(VehicleTypeService);
  });

  describe('getVehicleTypes', () => {
    it('should return all vehicle types', async () => {
      service.findAll.mockResolvedValue(mockVehicleTypes);

      const result = await resolver.getVehicleTypes();

      expect(result).toEqual(mockVehicleTypes);
      expect(service.findAll).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
      });
    });

    it('should return paginated vehicle types', async () => {
      service.findAll.mockResolvedValue([mockVehicleTypes[0]!]);

      const result = await resolver.getVehicleTypes(0, 1);

      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith({ skip: 0, take: 1 });
    });

    it('should return empty array when no vehicle types exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await resolver.getVehicleTypes();

      expect(result).toEqual([]);
    });
  });

  describe('getVehicleType', () => {
    it('should return vehicle type by id', async () => {
      service.findById.mockResolvedValue(mockVehicleTypes[0]!);

      const result = await resolver.getVehicleType(1);

      expect(result).toEqual(mockVehicleTypes[0]);
      expect(service.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when vehicle type not found', async () => {
      service.findById.mockResolvedValue(null);

      await expect(resolver.getVehicleType(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(resolver.getVehicleType(999)).rejects.toThrow(
        'VehicleType with id 999 not found',
      );
    });
  });

  describe('getVehicleTypesByMakeId', () => {
    it('should return vehicle types for a make', async () => {
      service.findByMakeId.mockResolvedValue(mockVehicleTypes);

      const result = await resolver.getVehicleTypesByMakeId(440);

      expect(result).toEqual(mockVehicleTypes);
      expect(service.findByMakeId).toHaveBeenCalledWith(440);
    });

    it('should return empty array when no vehicle types found for make', async () => {
      service.findByMakeId.mockResolvedValue([]);

      const result = await resolver.getVehicleTypesByMakeId(999);

      expect(result).toEqual([]);
    });
  });

  describe('searchVehicleTypes', () => {
    it('should search vehicle types by name', async () => {
      service.searchByName.mockResolvedValue([mockVehicleTypes[0]!]);

      const result = await resolver.searchVehicleTypes('Passenger');

      expect(result).toEqual([mockVehicleTypes[0]]);
      expect(service.searchByName).toHaveBeenCalledWith({
        name: 'Passenger',
        skip: undefined,
        take: undefined,
      });
    });

    it('should search with pagination', async () => {
      service.searchByName.mockResolvedValue(mockVehicleTypes);

      const result = await resolver.searchVehicleTypes('Car', 0, 10);

      expect(result).toEqual(mockVehicleTypes);
      expect(service.searchByName).toHaveBeenCalledWith({
        name: 'Car',
        skip: 0,
        take: 10,
      });
    });

    it('should return empty array when no matches', async () => {
      service.searchByName.mockResolvedValue([]);

      const result = await resolver.searchVehicleTypes('NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('getVehicleTypesCount', () => {
    it('should return total count', async () => {
      service.count.mockResolvedValue(50);

      const result = await resolver.getVehicleTypesCount();

      expect(result).toBe(50);
      expect(service.count).toHaveBeenCalled();
    });

    it('should return zero when no vehicle types exist', async () => {
      service.count.mockResolvedValue(0);

      const result = await resolver.getVehicleTypesCount();

      expect(result).toBe(0);
    });
  });
});

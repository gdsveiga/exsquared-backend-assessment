import { Test, TestingModule } from '@nestjs/testing';
import { VehicleTypeService } from './vehicle-type.service';
import { VehicleTypeRepository } from './vehicle-type.repository';

describe('VehicleTypeService', () => {
  let service: VehicleTypeService;
  let repository: jest.Mocked<VehicleTypeRepository>;

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
    const mockRepository = {
      findMany: jest.fn(),
      findById: jest.fn(),
      findByMakeId: jest.fn(),
      searchByName: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehicleTypeService,
        { provide: VehicleTypeRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<VehicleTypeService>(VehicleTypeService);
    repository = module.get(VehicleTypeRepository);
  });

  describe('findAll', () => {
    it('should return all vehicle types', async () => {
      repository.findMany.mockResolvedValue(mockVehicleTypes);

      const result = await service.findAll();

      expect(result).toEqual(mockVehicleTypes);
      expect(repository.findMany).toHaveBeenCalledWith({});
    });

    it('should pass pagination options', async () => {
      repository.findMany.mockResolvedValue([mockVehicleTypes[0]!]);

      const result = await service.findAll({ skip: 0, take: 1 });

      expect(result).toHaveLength(1);
      expect(repository.findMany).toHaveBeenCalledWith({ skip: 0, take: 1 });
    });

    it('should return empty array when no vehicle types exist', async () => {
      repository.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return vehicle type by id', async () => {
      repository.findById.mockResolvedValue(mockVehicleTypes[0]!);

      const result = await service.findById(1);

      expect(result).toEqual(mockVehicleTypes[0]);
      expect(repository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when vehicle type not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByMakeId', () => {
    it('should return vehicle types by makeId', async () => {
      repository.findByMakeId.mockResolvedValue(mockVehicleTypes);

      const result = await service.findByMakeId(440);

      expect(result).toEqual(mockVehicleTypes);
      expect(repository.findByMakeId).toHaveBeenCalledWith(440);
    });

    it('should return empty array when no vehicle types found for make', async () => {
      repository.findByMakeId.mockResolvedValue([]);

      const result = await service.findByMakeId(999);

      expect(result).toEqual([]);
    });
  });

  describe('searchByName', () => {
    it('should search vehicle types by name', async () => {
      repository.searchByName.mockResolvedValue([mockVehicleTypes[0]!]);

      const result = await service.searchByName({ name: 'Passenger' });

      expect(result).toEqual([mockVehicleTypes[0]]);
      expect(repository.searchByName).toHaveBeenCalledWith({
        name: 'Passenger',
      });
    });

    it('should pass pagination options with search', async () => {
      repository.searchByName.mockResolvedValue(mockVehicleTypes);

      const result = await service.searchByName({
        name: 'Car',
        skip: 0,
        take: 10,
      });

      expect(result).toEqual(mockVehicleTypes);
      expect(repository.searchByName).toHaveBeenCalledWith({
        name: 'Car',
        skip: 0,
        take: 10,
      });
    });

    it('should return empty array when no matches', async () => {
      repository.searchByName.mockResolvedValue([]);

      const result = await service.searchByName({ name: 'NonExistent' });

      expect(result).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return total count of vehicle types', async () => {
      repository.count.mockResolvedValue(50);

      const result = await service.count();

      expect(result).toBe(50);
      expect(repository.count).toHaveBeenCalled();
    });

    it('should return zero when no vehicle types exist', async () => {
      repository.count.mockResolvedValue(0);

      const result = await service.count();

      expect(result).toBe(0);
    });
  });
});

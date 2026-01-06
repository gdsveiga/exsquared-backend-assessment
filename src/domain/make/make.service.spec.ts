import { Test, TestingModule } from '@nestjs/testing';
import { MakeService } from './make.service';
import { MakeRepository } from './make.repository';

describe('MakeService', () => {
  let service: MakeService;
  let repository: jest.Mocked<MakeRepository>;

  const now = new Date();
  const mockMakes = [
    {
      id: 1,
      makeId: 440,
      makeName: 'Aston Martin',
      vehicleTypes: [] as {
        id: number;
        typeId: number;
        typeName: string;
        makeId: number;
        createdAt: Date;
        updatedAt: Date;
      }[],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 2,
      makeId: 441,
      makeName: 'BMW',
      vehicleTypes: [] as {
        id: number;
        typeId: number;
        typeName: string;
        makeId: number;
        createdAt: Date;
        updatedAt: Date;
      }[],
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
        MakeService,
        { provide: MakeRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<MakeService>(MakeService);
    repository = module.get(MakeRepository);
  });

  describe('findAll', () => {
    it('should return all makes', async () => {
      repository.findMany.mockResolvedValue(mockMakes);

      const result = await service.findAll();

      expect(result).toEqual(mockMakes);
      expect(repository.findMany).toHaveBeenCalledWith({});
    });

    it('should pass pagination options', async () => {
      repository.findMany.mockResolvedValue([mockMakes[0]!]);

      const result = await service.findAll({ skip: 0, take: 1 });

      expect(result).toHaveLength(1);
      expect(repository.findMany).toHaveBeenCalledWith({ skip: 0, take: 1 });
    });

    it('should return empty array when no makes exist', async () => {
      repository.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return make by id', async () => {
      repository.findById.mockResolvedValue(mockMakes[0]!);

      const result = await service.findById(1);

      expect(result).toEqual(mockMakes[0]);
      expect(repository.findById).toHaveBeenCalledWith(1);
    });

    it('should return null when make not found', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByMakeId', () => {
    it('should return make by makeId', async () => {
      repository.findByMakeId.mockResolvedValue(mockMakes[0]!);

      const result = await service.findByMakeId(440);

      expect(result).toEqual(mockMakes[0]);
      expect(repository.findByMakeId).toHaveBeenCalledWith(440);
    });

    it('should return null when make not found', async () => {
      repository.findByMakeId.mockResolvedValue(null);

      const result = await service.findByMakeId(999);

      expect(result).toBeNull();
    });
  });

  describe('searchByName', () => {
    it('should search makes by name', async () => {
      repository.searchByName.mockResolvedValue([mockMakes[0]!]);

      const result = await service.searchByName({ name: 'Aston' });

      expect(result).toEqual([mockMakes[0]]);
      expect(repository.searchByName).toHaveBeenCalledWith({ name: 'Aston' });
    });

    it('should pass pagination options with search', async () => {
      repository.searchByName.mockResolvedValue(mockMakes);

      const result = await service.searchByName({
        name: 'A',
        skip: 0,
        take: 10,
      });

      expect(result).toEqual(mockMakes);
      expect(repository.searchByName).toHaveBeenCalledWith({
        name: 'A',
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
    it('should return total count of makes', async () => {
      repository.count.mockResolvedValue(100);

      const result = await service.count();

      expect(result).toBe(100);
      expect(repository.count).toHaveBeenCalled();
    });

    it('should return zero when no makes exist', async () => {
      repository.count.mockResolvedValue(0);

      const result = await service.count();

      expect(result).toBe(0);
    });
  });
});

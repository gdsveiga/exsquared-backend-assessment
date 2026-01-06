import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { MakeResolver } from './make.resolver';
import { MakeService } from '../../../domain/make/make.service';

describe('MakeResolver', () => {
  let resolver: MakeResolver;
  let service: jest.Mocked<MakeService>;

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
    const mockService = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByMakeId: jest.fn(),
      searchByName: jest.fn(),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MakeResolver,
        { provide: MakeService, useValue: mockService },
      ],
    }).compile();

    resolver = module.get<MakeResolver>(MakeResolver);
    service = module.get(MakeService);
  });

  describe('getMakes', () => {
    it('should return all makes', async () => {
      service.findAll.mockResolvedValue(mockMakes);

      const result = await resolver.getMakes();

      expect(result).toEqual(mockMakes);
      expect(service.findAll).toHaveBeenCalledWith({
        skip: undefined,
        take: undefined,
      });
    });

    it('should return paginated makes', async () => {
      service.findAll.mockResolvedValue([mockMakes[0]!]);

      const result = await resolver.getMakes(0, 1);

      expect(result).toHaveLength(1);
      expect(service.findAll).toHaveBeenCalledWith({ skip: 0, take: 1 });
    });

    it('should return empty array when no makes exist', async () => {
      service.findAll.mockResolvedValue([]);

      const result = await resolver.getMakes();

      expect(result).toEqual([]);
    });
  });

  describe('getMake', () => {
    it('should return make by id', async () => {
      service.findById.mockResolvedValue(mockMakes[0]!);

      const result = await resolver.getMake(1);

      expect(result).toEqual(mockMakes[0]);
      expect(service.findById).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when make not found', async () => {
      service.findById.mockResolvedValue(null);

      await expect(resolver.getMake(999)).rejects.toThrow(NotFoundException);
      await expect(resolver.getMake(999)).rejects.toThrow(
        'Make with id 999 not found',
      );
    });
  });

  describe('getMakeByMakeId', () => {
    it('should return make by makeId', async () => {
      service.findByMakeId.mockResolvedValue(mockMakes[0]!);

      const result = await resolver.getMakeByMakeId(440);

      expect(result).toEqual(mockMakes[0]);
      expect(service.findByMakeId).toHaveBeenCalledWith(440);
    });

    it('should throw NotFoundException when make not found', async () => {
      service.findByMakeId.mockResolvedValue(null);

      await expect(resolver.getMakeByMakeId(999)).rejects.toThrow(
        NotFoundException,
      );
      await expect(resolver.getMakeByMakeId(999)).rejects.toThrow(
        'Make with makeId 999 not found',
      );
    });
  });

  describe('searchMakes', () => {
    it('should search makes by name', async () => {
      service.searchByName.mockResolvedValue([mockMakes[0]!]);

      const result = await resolver.searchMakes('Aston');

      expect(result).toEqual([mockMakes[0]]);
      expect(service.searchByName).toHaveBeenCalledWith({
        name: 'Aston',
        skip: undefined,
        take: undefined,
      });
    });

    it('should search with pagination', async () => {
      service.searchByName.mockResolvedValue(mockMakes);

      const result = await resolver.searchMakes('A', 0, 10);

      expect(result).toEqual(mockMakes);
      expect(service.searchByName).toHaveBeenCalledWith({
        name: 'A',
        skip: 0,
        take: 10,
      });
    });

    it('should return empty array when no matches', async () => {
      service.searchByName.mockResolvedValue([]);

      const result = await resolver.searchMakes('NonExistent');

      expect(result).toEqual([]);
    });
  });

  describe('getMakesCount', () => {
    it('should return total count', async () => {
      service.count.mockResolvedValue(100);

      const result = await resolver.getMakesCount();

      expect(result).toBe(100);
      expect(service.count).toHaveBeenCalled();
    });

    it('should return zero when no makes exist', async () => {
      service.count.mockResolvedValue(0);

      const result = await resolver.getMakesCount();

      expect(result).toBe(0);
    });
  });
});

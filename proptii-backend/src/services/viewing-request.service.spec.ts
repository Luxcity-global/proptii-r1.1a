import { Test, TestingModule } from '@nestjs/testing';
import { ViewingRequestService } from './viewing-request.service';
import { CreateViewingRequestDto } from '../dtos/viewing-request.dto';
import { BadRequestException } from '@nestjs/common';

describe('ViewingRequestService', () => {
  let service: ViewingRequestService;

  // Mock Cosmos container
  const mockContainer = {
    items: {
      query: jest.fn().mockReturnValue({
        fetchAll: jest.fn().mockResolvedValue({ resources: [] }),
      }),
      create: jest.fn().mockResolvedValue({
        resource: { id: 'test-id', type: 'viewing-request' },
      }),
    },
    item: jest.fn().mockReturnValue({
      read: jest.fn(),
      replace: jest.fn(),
      delete: jest.fn(),
    }),
  };

  const mockCosmosClient = {
    database: jest.fn().mockReturnValue({
      container: jest.fn().mockReturnValue(mockContainer),
    }),
  };

  const mockCreateDto: CreateViewingRequestDto = {
    property: { street: '10 Test St', city: 'London', town: 'Islington', postcode: 'N1 1AA' },
    agent: { name: 'Test Agent', email: 'agent@test.com', phone: '07700000000', company: 'Test Agency' },
    viewing_date: new Date('2025-06-01'),
    viewing_time: '10:00',
    preference: 'Morning',
    whatsappNumber: '',
    status: 'PENDING',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ViewingRequestService,
        { provide: 'COSMOS_CLIENT', useValue: mockCosmosClient },
        { provide: 'FIRESTORE', useValue: null },
      ],
    }).compile();

    service = module.get<ViewingRequestService>(ViewingRequestService);
  });

  describe('create', () => {
    it('should create a viewing request in Cosmos DB', async () => {
      const result = await service.create(mockCreateDto);
      expect(result).toBeDefined();
      expect(mockContainer.items.create).toHaveBeenCalledTimes(1);
    });

    it('should throw BadRequestException when slot is already booked', async () => {
      // Mock conflicting viewing found
      mockContainer.items.query.mockReturnValueOnce({
        fetchAll: jest.fn().mockResolvedValue({
          resources: [{ id: 'conflict', status: 'CONFIRMED' }],
        }),
      });

      await expect(service.create(mockCreateDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return an array of viewing requests from Cosmos DB', async () => {
      mockContainer.items.query.mockReturnValueOnce({
        fetchAll: jest.fn().mockResolvedValue({
          resources: [{ id: '1', type: 'viewing-request' }],
        }),
      });

      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('remove', () => {
    it('should delete a viewing request by ID', async () => {
      await service.remove('test-id');
      expect(mockContainer.item).toHaveBeenCalledWith('test-id');
    });
  });
});

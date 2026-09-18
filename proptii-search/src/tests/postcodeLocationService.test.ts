import { PostcodeLocationService } from '../core/services/PostcodeLocationService';

jest.mock('../infrastructure/queue', () => ({
  connection: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  },
}));

describe('PostcodeLocationService', () => {
  let service: PostcodeLocationService;

  beforeEach(() => {
    service = new PostcodeLocationService();
    jest.clearAllMocks();
  });

  describe('extractLocationString', () => {
    it('extracts full UK postcodes from query', () => {
      expect(service.extractLocationString('2 bed flat in E14 9GE under 3000')).toBe('E14 9GE');
      expect(service.extractLocationString('SW10 9EL apartments to rent')).toBe('SW10 9EL');
      expect(service.extractLocationString('houses in NW1 6XE')).toBe('NW1 6XE');
    });

    it('extracts UK outcodes from query', () => {
      expect(service.extractLocationString('flats in SW10')).toBe('SW10');
      expect(service.extractLocationString('2 bedroom property in E14 under 2500')).toBe('E14');
      expect(service.extractLocationString('studio in M1')).toBe('M1');
    });

    it('extracts named areas and boroughs', () => {
      expect(service.extractLocationString('penthouse in Canary Wharf under 5000')).toBe('Canary Wharf');
      expect(service.extractLocationString('flats around Richmond upon Thames')).toBe('Richmond upon Thames');
      expect(service.extractLocationString('apartments near Shoreditch')).toBe('Shoreditch');
    });

    it('defaults to London for empty or unparseable queries', () => {
      expect(service.extractLocationString('')).toBe('London');
      expect(service.extractLocationString('   ')).toBe('London');
    });
  });

  describe('resolve', () => {
    it('resolves full UK postcode to coordinates, district, and portal IDs', async () => {
      const result = await service.resolve('2 bed flat in E14 9GE under 3000');

      expect(result).toBeDefined();
      expect(result.postcode).toBe('E14 9GE');
      expect(result.outcode).toBe('E14');
      expect(result.adminDistrict).toBe('Tower Hamlets');
      expect(result.coordinates.lat).toBeCloseTo(51.498, 1);
      expect(result.coordinates.lng).toBeCloseTo(-0.014, 1);
      expect(result.otmLocationSlug).toBe('e14');
      expect(result.rightmoveLocationId).toMatch(/^(OUTCODE|REGION|POSTCODE)\^/);
    });

    it('resolves UK outcode to centroid coordinates and portal slugs', async () => {
      const result = await service.resolve('flats in SW10');

      expect(result).toBeDefined();
      expect(result.outcode).toBe('SW10');
      expect(result.coordinates.lat).toBeGreaterThan(51.4);
      expect(result.coordinates.lng).toBeLessThan(0);
      expect(result.otmLocationSlug).toBe('sw10');
      expect(result.rightmoveLocationId).toMatch(/^(OUTCODE|REGION)\^/);
    });

    it('resolves mapped London districts to their correct outcode coordinates', async () => {
      const result = await service.resolve('luxury apartment in Canary Wharf');

      expect(result).toBeDefined();
      expect(result.outcode).toBe('E14');
      expect(result.adminDistrict).toBe('Tower Hamlets');
      expect(result.coordinates.lat).toBeGreaterThan(51.4);
      expect(result.otmLocationSlug).toBe('e14');
      expect(result.rightmoveLocationId).toBe('REGION^70384');
    });

    it('resolves major UK cities with coordinates and portal identifiers', async () => {
      const result = await service.resolve('apartments in Manchester');

      expect(result).toBeDefined();
      expect(result.coordinates.lat).toBeGreaterThan(53.0);
      expect(result.coordinates.lng).toBeLessThan(-2.0);
      expect(result.rightmoveLocationId).toBe('REGION^904');
    });

    it('returns cached results on subsequent calls without re-fetching', async () => {
      const query = 'flats in SW10';
      const first = await service.resolve(query);
      const second = await service.resolve(query);

      expect(first).toEqual(second);
    });
  });

  describe('resolveRightmoveIdentifier', () => {
    it('returns known static location IDs instantly', async () => {
      const rmId = await service.resolveRightmoveIdentifier('london');
      expect(rmId).toBe('REGION^87490');

      const manchesterId = await service.resolveRightmoveIdentifier('manchester');
      expect(manchesterId).toBe('REGION^904');
    });

    it('falls back to London REGION^87490 for unknown terms without matches', async () => {
      const rmId = await service.resolveRightmoveIdentifier('nonexistentplacename12345xyz');
      expect(rmId).toBe('REGION^87490');
    });
  });
});

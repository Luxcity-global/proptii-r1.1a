import { AgencyPatternEngine } from '../core/services/AgencyPatternEngine';
import { AgentEnrichmentService } from '../core/services/AgentEnrichmentService';

jest.mock('../infrastructure/queue', () => ({
  connection: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
  },
}));

describe('AgencyPatternEngine', () => {
  describe('resolvePatternEmail', () => {
    it('resolves Foxtons with branch', () => {
      const res = AgencyPatternEngine.resolvePatternEmail('Foxtons, Islington', 'Islington');
      expect(res).not.toBeNull();
      expect(res?.email).toBe('islingtonlettings@foxtons.co.uk');
      expect(res?.website).toBe('https://www.foxtons.co.uk');
    });

    it('resolves Dexters with dash and noise words', () => {
      const res = AgencyPatternEngine.resolvePatternEmail('Dexters - Camden Lettings Estate Agents', 'London');
      expect(res).not.toBeNull();
      expect(res?.email).toBe('camdenlettings@dexters.co.uk');
      expect(res?.website).toBe('https://www.dexters.co.uk');
    });

    it('resolves KFH with dot notation', () => {
      const res = AgencyPatternEngine.resolvePatternEmail('KFH Clapham', 'Clapham');
      expect(res).not.toBeNull();
      expect(res?.email).toBe('clapham.lettings@kfh.co.uk');
      expect(res?.website).toBe('https://www.kfh.co.uk');
    });

    it('resolves Savills with branch in parentheses', () => {
      const res = AgencyPatternEngine.resolvePatternEmail('Savills (Richmond)', 'Richmond');
      expect(res).not.toBeNull();
      expect(res?.email).toBe('richmondlettings@savills.com');
      expect(res?.website).toBe('https://www.savills.com');
    });

    it('resolves Knight Frank', () => {
      const res = AgencyPatternEngine.resolvePatternEmail('Knight Frank, Hampstead', 'Hampstead');
      expect(res).not.toBeNull();
      expect(res?.email).toBe('hampsteadlettings@knightfrank.com');
      expect(res?.website).toBe('https://www.knightfrank.com');
    });

    it('resolves Hamptons stripping International descriptor', () => {
      const res = AgencyPatternEngine.resolvePatternEmail('Hamptons International, Canary Wharf', 'London');
      expect(res).not.toBeNull();
      expect(res?.email).toBe('canarywharflettings@hamptons.co.uk');
      expect(res?.website).toBe('https://www.hamptons.co.uk');
    });

    it('resolves Winkworth', () => {
      const res = AgencyPatternEngine.resolvePatternEmail('Winkworth Kensington Estate Agents', 'Kensington');
      expect(res).not.toBeNull();
      expect(res?.email).toBe('kensington@winkworth.co.uk');
      expect(res?.website).toBe('https://www.winkworth.co.uk');
    });

    it('resolves OpenRent direct enquiries', () => {
      const res = AgencyPatternEngine.resolvePatternEmail('OpenRent', 'Manchester');
      expect(res).not.toBeNull();
      expect(res?.email).toBe('enquiries@openrent.co.uk');
    });

    it('resolves Purplebricks', () => {
      const res = AgencyPatternEngine.resolvePatternEmail('Purplebricks', 'Bristol');
      expect(res).not.toBeNull();
      expect(res?.email).toBe('lettings@purplebricks.com');
    });

    it('uses location fallback when agency name has no branch', () => {
      const res = AgencyPatternEngine.resolvePatternEmail('Foxtons', 'Brixton');
      expect(res).not.toBeNull();
      expect(res?.email).toBe('brixtonlettings@foxtons.co.uk');
    });

    it('returns null for unknown local agency', () => {
      const res = AgencyPatternEngine.resolvePatternEmail('Boutique Independent Homes', 'Camden');
      expect(res).toBeNull();
    });

    it('handles empty or null inputs gracefully', () => {
      expect(AgencyPatternEngine.resolvePatternEmail(null)).toBeNull();
      expect(AgencyPatternEngine.resolvePatternEmail('')).toBeNull();
    });
  });
});

describe('AgentEnrichmentService - Strict Email Mode', () => {
  let service: AgentEnrichmentService;

  beforeEach(() => {
    service = new AgentEnrichmentService();
    jest.clearAllMocks();
  });

  it('enriches property via pattern engine and retains it in strict mode', async () => {
    const properties = [
      {
        id: 'prop-1',
        title: 'Modern 2 bed flat',
        agent: { name: 'Foxtons, Islington' },
        location: 'Islington, London'
      }
    ];

    const strict = await service.enrichStrict(properties);
    expect(strict.length).toBe(1);
    expect(strict[0].agent.email).toBe('islingtonlettings@foxtons.co.uk');
  });

  it('enriches property via listing description regex and retains it in strict mode', async () => {
    const properties = [
      {
        id: 'prop-2',
        title: 'Boutique apartment',
        description: 'For viewings or queries please email contact@boutiquehomes.co.uk directly.',
        agent: { name: 'Boutique Homes' },
        location: 'Hackney, London'
      }
    ];

    const strict = await service.enrichStrict(properties);
    expect(strict.length).toBe(1);
    expect(strict[0].agent.email).toBe('contact@boutiquehomes.co.uk');
  });

  it('strictly filters out properties where NO email could be resolved', async () => {
    const properties = [
      {
        id: 'prop-3',
        title: 'Mystery cottage',
        description: 'Call us on 02079460991 for details.',
        agent: { name: 'Unknown Mystery Agent XYZ 999' },
        location: 'Nowhere'
      },
      {
        id: 'prop-4',
        title: 'Flat with Dexters',
        agent: { name: 'Dexters Camden' },
        location: 'Camden'
      }
    ];

    const strict = await service.enrichStrict(properties);
    // prop-3 has no email, prop-4 is matched by Dexters pattern
    expect(strict.length).toBe(1);
    expect(strict[0].id).toBe('prop-4');
    expect(strict[0].agent.email).toBe('camdenlettings@dexters.co.uk');
  });
});

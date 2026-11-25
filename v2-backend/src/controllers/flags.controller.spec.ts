/**
 * flags.controller.spec.ts
 *
 * Unit tests for FlagsController.getFlags()
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FlagsController } from './flags.controller';
import type { FactsStoreService } from '../gov-data/services/facts-store.service';

function makeMockFactsStore(gov: boolean, c1 = false): FactsStoreService {
  return {
    isGovDataLayerEnabled: vi.fn().mockResolvedValue(gov),
    isRuntimeFlagEnabled: vi.fn().mockResolvedValue(c1),
  } as unknown as FactsStoreService;
}

function makeController(
  gov: boolean,
  cacheValue: any = null,
  c1 = false,
): {
  controller: FlagsController;
  getCached: ReturnType<typeof vi.fn>;
  setCached: ReturnType<typeof vi.fn>;
  isGovDataLayerEnabled: ReturnType<typeof vi.fn>;
  isRuntimeFlagEnabled: ReturnType<typeof vi.fn>;
} {
  const factsStore = makeMockFactsStore(gov, c1);
  const controller = new FlagsController(factsStore);

  const getCached = vi.fn().mockResolvedValue(cacheValue);
  const setCached = vi.fn().mockResolvedValue(undefined);

  vi.spyOn(controller as any, 'getCached').mockImplementation(getCached);
  vi.spyOn(controller as any, 'setCached').mockImplementation(setCached);

  return {
    controller,
    getCached,
    setCached,
    isGovDataLayerEnabled: factsStore.isGovDataLayerEnabled as ReturnType<typeof vi.fn>,
    isRuntimeFlagEnabled: factsStore.isRuntimeFlagEnabled as ReturnType<typeof vi.fn>,
  };
}

describe('FlagsController.getFlags()', () => {
  beforeEach(() => {
    delete process.env.C1_VERIFICATION_GATE;
    delete process.env.FLAG_C1_VERIFICATION_GATE;
  });

  afterEach(() => {
    delete process.env.C1_VERIFICATION_GATE;
    delete process.env.FLAG_C1_VERIFICATION_GATE;
  });

  it('returns gov + c1 flags on cache miss', async () => {
    const { controller, isGovDataLayerEnabled, isRuntimeFlagEnabled, setCached } = makeController(
      true,
      null,
      false,
    );
    const result = await controller.getFlags();
    expect(result).toEqual({ gov_data_layer: true, c1_verification_gate: false });
    expect(isGovDataLayerEnabled).toHaveBeenCalledOnce();
    expect(isRuntimeFlagEnabled).toHaveBeenCalledWith('c1_verification_gate', false);
    expect(setCached).toHaveBeenCalledWith(result);
  });

  it('returns c1_verification_gate true when enabled', async () => {
    const { controller } = makeController(true, null, true);
    const result = await controller.getFlags();
    expect(result.c1_verification_gate).toBe(true);
  });

  it('returns cached bundle without hitting Firestore', async () => {
    const cached = { gov_data_layer: false, c1_verification_gate: true };
    const { controller, isGovDataLayerEnabled, isRuntimeFlagEnabled } = makeController(true, cached);
    const result = await controller.getFlags();
    expect(result).toEqual(cached);
    expect(isGovDataLayerEnabled).not.toHaveBeenCalled();
    expect(isRuntimeFlagEnabled).not.toHaveBeenCalled();
  });

  it('env C1_VERIFICATION_GATE=true overrides Firestore and cache', async () => {
    process.env.C1_VERIFICATION_GATE = 'true';
    const cached = { gov_data_layer: true, c1_verification_gate: false };
    const { controller } = makeController(true, cached, false);
    const result = await controller.getFlags();
    expect(result).toEqual({ gov_data_layer: true, c1_verification_gate: true });
  });

  it('env C1_VERIFICATION_GATE=false overrides Firestore true', async () => {
    process.env.C1_VERIFICATION_GATE = 'false';
    const { controller } = makeController(true, null, true);
    const result = await controller.getFlags();
    expect(result.c1_verification_gate).toBe(false);
  });
});

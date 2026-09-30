import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LandlordsController } from './landlords.controller';
import { LandlordsService } from '../services/landlords.service';

describe('Section 7: Landlords & Clients Landlords Endpoints', () => {
  let controller: LandlordsController;
  let service: any;

  beforeEach(() => {
    service = {
      getAllLandlords: vi.fn(),
      checkLandlord: vi.fn(),
      registerLandlord: vi.fn(),
      getLandlordById: vi.fn(),
      updateLandlord: vi.fn(),
      deleteLandlord: vi.fn(),
    };
    controller = new LandlordsController(service);
  });

  it('[GET /landlords] returns all registered landlords and agents', async () => {
    service.getAllLandlords.mockResolvedValue([
      { id: 'll-1', name: 'Landlord One', email: 'one@test.com' },
    ]);
    const res = await controller.getAllLandlords();
    expect(res).toHaveLength(1);
    expect(res[0].name).toBe('Landlord One');
  });

  it('[GET /landlords/check] verifies email existence in landlord directory', async () => {
    service.checkLandlord.mockResolvedValue({ exists: true, role: 'landlord' });
    const res1 = await controller.checkLandlord('valid@test.com');
    expect(res1.exists).toBe(true);

    const res2 = await controller.checkLandlord('');
    expect(res2).toEqual({ exists: false });
  });

  it('[POST /landlords/register] registers a new landlord profile', async () => {
    service.registerLandlord.mockResolvedValue({ success: true, id: 'll-new' });
    const res = await controller.registerLandlord({ name: 'Agency Pro', email: 'agency@test.com' });
    expect(service.registerLandlord).toHaveBeenCalledWith({ name: 'Agency Pro', email: 'agency@test.com' });
    expect(res.id).toBe('ll-new');
  });

  it('[GET /clients/landlords] frontend alias returns landlord collection', async () => {
    service.getAllLandlords.mockResolvedValue([{ id: 'll-2' }]);
    const res = await controller.getClientLandlords();
    expect(service.getAllLandlords).toHaveBeenCalled();
    expect(res).toHaveLength(1);
  });

  it('[POST /clients/landlords] frontend alias creates landlord record', async () => {
    service.registerLandlord.mockResolvedValue({ success: true, id: 'll-client-1' });
    const res = await controller.createClientLandlord({ name: 'Client LL' });
    expect(res.id).toBe('ll-client-1');
  });

  it('[GET /clients/landlords/:id] returns single landlord by ID', async () => {
    service.getLandlordById.mockResolvedValue({ id: 'll-1', name: 'John Doe' });
    const res = await controller.getClientLandlordById('ll-1');
    expect(service.getLandlordById).toHaveBeenCalledWith('ll-1');
    expect(res.name).toBe('John Doe');
  });

  it('[PUT /clients/landlords/:id] updates landlord details', async () => {
    service.updateLandlord.mockResolvedValue({ success: true });
    const res = await controller.updateClientLandlord('ll-1', { phone: '07123456789' });
    expect(service.updateLandlord).toHaveBeenCalledWith('ll-1', { phone: '07123456789' });
    expect(res.success).toBe(true);
  });

  it('[DELETE /clients/landlords/:id] deletes landlord record', async () => {
    service.deleteLandlord.mockResolvedValue({ success: true });
    const res = await controller.deleteClientLandlord('ll-1');
    expect(service.deleteLandlord).toHaveBeenCalledWith('ll-1');
    expect(res.success).toBe(true);
  });
});

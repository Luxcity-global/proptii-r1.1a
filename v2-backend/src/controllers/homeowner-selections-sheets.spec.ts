import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PropertySelectionsController } from './property-selections.controller';
import { HomeownerController } from './homeowner.controller';
import { SheetsController } from './sheets.controller';
import { ForbiddenException } from '@nestjs/common';

describe('Section 19, 20 & 21: Property Selections, Homeowner & Sheets Endpoints', () => {
  describe('PropertySelectionsController', () => {
    let controller: PropertySelectionsController;
    let service: any;

    beforeEach(() => {
      service = {
        getSelections: vi.fn(),
        getStats: vi.fn(),
        createSelection: vi.fn(),
      };
      controller = new PropertySelectionsController(service);
    });

    it('[GET /property-selections] lists property selections for tenant', async () => {
      service.getSelections.mockResolvedValue([{ id: 'sel-1', propertyId: 'prop-1' }]);
      const req = { user: { uid: 'tenant-1' } };

      const res = await controller.getSelections(req, 'interested');
      expect(service.getSelections).toHaveBeenCalledWith('tenant-1', 'interested');
      expect(res).toHaveLength(1);
    });

    it('[POST /property-selections] marks interest in a property', async () => {
      service.createSelection.mockResolvedValue({ id: 'sel-2', status: 'interested' });
      const req = { user: { uid: 'tenant-1' } };
      const body = { propertyId: 'prop-2', status: 'interested' };

      const res = await controller.createSelection(req, body);
      expect(service.createSelection).toHaveBeenCalledWith('tenant-1', body);
      expect(res.id).toBe('sel-2');
    });

    it('[GET /property-selections/stats] retrieves selection funnel counts', async () => {
      service.getStats.mockResolvedValue({ total: 10, viewingRequested: 3, shortlisted: 7 });
      const req = { user: { uid: 'tenant-1' } };

      const res = await controller.getStats(req);
      expect(service.getStats).toHaveBeenCalledWith('tenant-1');
      expect(res.total).toBe(10);
    });
  });

  describe('HomeownerController', () => {
    let controller: HomeownerController;
    let service: any;

    beforeEach(() => {
      service = {
        getMaintenanceTasks: vi.fn(),
        createMaintenanceTask: vi.fn(),
      };
      controller = new HomeownerController(service);
    });

    it('[GET /homeowner-maintenance] lists maintenance tasks for homeowner', async () => {
      service.getMaintenanceTasks.mockResolvedValue([
        { id: 'task-1', taskName: 'Boiler Service', dueDate: '2026-10-15' },
      ]);
      const req = { user: { uid: 'homeowner-1' } };

      const res = await controller.getMaintenanceTasks(req);
      expect(service.getMaintenanceTasks).toHaveBeenCalledWith('homeowner-1');
      expect(res).toHaveLength(1);
    });

    it('[POST /homeowner-maintenance] creates new maintenance schedule task', async () => {
      service.createMaintenanceTask.mockResolvedValue({ id: 'task-2', taskName: 'Gutter Cleaning' });
      const req = { user: { uid: 'homeowner-1' } };
      const body = { taskName: 'Gutter Cleaning', frequency: 'annual' };

      const res = await controller.createMaintenanceTask(req, body);
      expect(service.createMaintenanceTask).toHaveBeenCalledWith('homeowner-1', body);
      expect(res.id).toBe('task-2');
    });
  });

  describe('SheetsController', () => {
    let controller: SheetsController;
    let service: any;

    beforeEach(() => {
      service = {
        appendRow: vi.fn(),
        getSheetData: vi.fn(),
      };
      controller = new SheetsController(service);
    });

    it('[POST /sheets] appends row to waitlist or marketing lead spreadsheet', async () => {
      service.appendRow.mockResolvedValue({ success: true, rowId: 'row-1' });
      const body = { email: 'waitlist@example.com', name: 'Waitlist User' };

      const res = await controller.appendRow(body, 'waitlist');
      expect(service.appendRow).toHaveBeenCalledWith('waitlist', body);
      expect(res.success).toBe(true);
    });

    it('[GET /sheets/:sheetId] requires admin privileges and returns sheet data', async () => {
      service.getSheetData.mockResolvedValue({ rows: [{ email: 'lead@test.com' }] });

      const adminReq = { user: { email: 'admin@proptii.co', role: 'admin' } };
      const res = await controller.getSheet(adminReq, 'leads');
      expect(service.getSheetData).toHaveBeenCalledWith('leads');
      expect(res.rows).toHaveLength(1);

      const nonAdminReq = { user: { email: 'regular@user.com', role: 'tenant' } };
      await expect(controller.getSheet(nonAdminReq, 'leads')).rejects.toThrow(ForbiddenException);
    });
  });
});

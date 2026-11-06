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
        updateStatus: vi.fn(),
        deleteSelection: vi.fn(),
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

    it('[PUT /property-selections/:id/status] passes req.user.uid to service for ownership enforcement', async () => {
      service.updateSelectionStatus = vi.fn().mockResolvedValue({ success: true, id: 'sel-1', status: 'shortlisted' });
      const req = { user: { uid: 'tenant-1' } };

      const res = await controller.updateStatus(req, 'sel-1', { status: 'shortlisted', notes: 'Great location' });
      expect(service.updateSelectionStatus).toHaveBeenCalledWith('sel-1', 'tenant-1', 'shortlisted', 'Great location');
      expect(res.success).toBe(true);
    });

    it('[DELETE /property-selections/:id] passes req.user.uid to service for ownership enforcement', async () => {
      service.deleteSelection.mockResolvedValue({ success: true });
      const req = { user: { uid: 'tenant-1' } };

      const res = await controller.deleteSelection(req, 'sel-1');
      expect(service.deleteSelection).toHaveBeenCalledWith('sel-1', 'tenant-1');
      expect(res.success).toBe(true);
    });
  });

  describe('HomeownerController', () => {
    let controller: HomeownerController;
    let service: any;

    beforeEach(() => {
      service = {
        getMaintenanceTasks: vi.fn(),
        createMaintenanceTask: vi.fn(),
        updateMaintenanceTask: vi.fn(),
        deleteMaintenanceTask: vi.fn(),
        updateProject: vi.fn(),
        deleteProject: vi.fn(),
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

    it('[PUT /homeowner-maintenance/:id] passes req.user.uid to service for task ownership check', async () => {
      service.updateMaintenanceTask.mockResolvedValue({ success: true });
      const req = { user: { uid: 'homeowner-1' } };
      const body = { status: 'completed' };

      const res = await controller.updateMaintenanceTask(req, 'task-1', body);
      expect(service.updateMaintenanceTask).toHaveBeenCalledWith('task-1', 'homeowner-1', body);
      expect(res.success).toBe(true);
    });

    it('[DELETE /homeowner-maintenance/:id] passes req.user.uid to service for task ownership check', async () => {
      service.deleteMaintenanceTask.mockResolvedValue({ success: true });
      const req = { user: { uid: 'homeowner-1' } };

      const res = await controller.deleteMaintenanceTask(req, 'task-1');
      expect(service.deleteMaintenanceTask).toHaveBeenCalledWith('task-1', 'homeowner-1');
      expect(res.success).toBe(true);
    });

    it('[PUT /homeowner-projects/:id] passes req.user.uid to service for project ownership check', async () => {
      service.updateProject.mockResolvedValue({ success: true });
      const req = { user: { uid: 'homeowner-1' } };
      const body = { budget: 5000 };

      const res = await controller.updateProject(req, 'proj-1', body);
      expect(service.updateProject).toHaveBeenCalledWith('proj-1', 'homeowner-1', body);
      expect(res.success).toBe(true);
    });

    it('[DELETE /homeowner-projects/:id] passes req.user.uid to service for project ownership check', async () => {
      service.deleteProject.mockResolvedValue({ success: true });
      const req = { user: { uid: 'homeowner-1' } };

      const res = await controller.deleteProject(req, 'proj-1');
      expect(service.deleteProject).toHaveBeenCalledWith('proj-1', 'homeowner-1');
      expect(res.success).toBe(true);
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

    it('[POST /sheets] strictly rejects non-whitelisted sheet when caller is not admin', async () => {
      const nonAdminReq = { user: { email: 'user@test.com', role: 'tenant' } };
      await expect(
        controller.appendRow({ email: 'leak@test.com' }, 'financial_secrets', nonAdminReq),
      ).rejects.toThrow(ForbiddenException);
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

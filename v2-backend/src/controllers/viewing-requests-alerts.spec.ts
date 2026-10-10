import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViewingRequestController } from './viewing-request.controller';
import { AlertsController } from './alerts.controller';
import { of } from 'rxjs';

describe('Section 8 & 9: Viewing Requests & Alerts Endpoints', () => {
  describe('ViewingRequestController', () => {
    let controller: ViewingRequestController;
    let viewingService: any;
    let eventsService: any;

    beforeEach(() => {
      viewingService = {
        createViewing: vi.fn(),
        getViewingRequests: vi.fn(),
        getViewingById: vi.fn(),
        updateViewingStatus: vi.fn(),
        cancelViewing: vi.fn(),
      };
      eventsService = {
        subscribe: vi.fn().mockReturnValue(of({ data: 'viewing_ping' })),
        emit: vi.fn(),
      };
      controller = new ViewingRequestController(viewingService, eventsService);
    });

    it('[POST /viewing-requests] creates viewing and emits viewing_created SSE event', async () => {
      viewingService.createViewing.mockResolvedValue({ id: 'vr-101' });
      const req = { user: { uid: 'tenant-1', email: 'tenant@test.com' } };
      const body = {
        propertyId: 'prop-1',
        agentEmail: 'agent@proptii.co',
        landlordId: 'll-1',
      };

      const res = await controller.createViewing(req, body);
      expect(res.id).toBe('vr-101');
      expect(viewingService.createViewing).toHaveBeenCalledWith('tenant-1', 'tenant@test.com', body);
      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'viewing_created',
          userId: 'tenant-1',
          targetEmail: 'agent@proptii.co',
        }),
      );
    });

    it('[GET /viewing-requests] retrieves requests filtered by user role', async () => {
      viewingService.getViewingRequests.mockResolvedValue([{ id: 'vr-101' }]);
      const req = { user: { uid: 'tenant-1', role: 'tenant' } };

      const res = await controller.getViewings(req);
      expect(viewingService.getViewingRequests).toHaveBeenCalledWith('tenant-1', 'tenant', undefined);
      expect(res).toHaveLength(1);
    });

    it('[GET /viewing-requests/:id] gets single viewing request', async () => {
      viewingService.getViewingById.mockResolvedValue({ id: 'vr-101', status: 'pending' });
      const req = { user: { uid: 'tenant-1' } };

      const res = await controller.getViewingById('vr-101', req);
      expect(viewingService.getViewingById).toHaveBeenCalledWith('vr-101', req.user);
      expect(res.id).toBe('vr-101');
    });

    it('[PUT /viewing-requests/:id] updates viewing request status and emits update SSE event', async () => {
      viewingService.updateViewingStatus.mockResolvedValue({
        id: 'vr-101',
        tenantEmail: 'tenant@test.com',
        agentEmail: 'agent@proptii.co',
        propertyId: 'prop-1',
      });
      const req = { user: { uid: 'll-1' } };

      const res = await controller.updateViewingStatus(req, 'vr-101', {
        status: 'confirmed',
        notes: 'Meet at reception',
      });
      expect(viewingService.updateViewingStatus).toHaveBeenCalledWith('vr-101', 'll-1', 'confirmed', 'Meet at reception', req.user, { agentNotes: undefined, viewingDetails: undefined });
      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'viewing_updated',
          data: expect.objectContaining({
            id: 'vr-101',
            status: 'confirmed',
            notes: 'Meet at reception',
            updatedBy: 'll-1',
          }),
        }),
      );
    });

    it('[DELETE /viewing-requests/:id] cancels viewing request and emits cancel SSE event', async () => {
      viewingService.cancelViewing.mockResolvedValue({
        id: 'vr-101',
        tenantEmail: 'tenant@test.com',
        agentEmail: 'agent@proptii.co',
      });
      const req = { user: { uid: 'tenant-1' } };

      const res = await controller.cancelViewing(req, 'vr-101');
      expect(viewingService.cancelViewing).toHaveBeenCalledWith('vr-101', 'tenant-1', req.user);
      expect(eventsService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'viewing_deleted',
          data: expect.objectContaining({
            id: 'vr-101',
            cancelledBy: 'tenant-1',
          }),
        }),
      );
    });

    it('[GET /viewing-requests/events] connects to SSE stream', () => {
      const req = { user: { uid: 'tenant-1', email: 'tenant@test.com', role: 'tenant' } };
      const stream$ = controller.sendViewingEvents(req);
      expect(eventsService.subscribe).toHaveBeenCalledWith('tenant-1', 'tenant@test.com', 'tenant');
      expect(stream$).toBeDefined();
    });
  });

  describe('AlertsController', () => {
    let controller: AlertsController;
    let alertsService: any;
    let eventsService: any;

    beforeEach(() => {
      alertsService = {
        getAlerts: vi.fn(),
        createAlert: vi.fn(),
        markAlertRead: vi.fn(),
        deleteAlert: vi.fn(),
      };
      eventsService = {
        subscribe: vi.fn().mockReturnValue(of({ data: 'alert_ping' })),
        emit: vi.fn(),
      };
      controller = new AlertsController(alertsService, eventsService);
    });

    it('[GET /alerts] lists user alerts', async () => {
      alertsService.getAlerts.mockResolvedValue([{ id: 'alt-1', title: 'Payment received' }]);
      const req = { user: { uid: 'u-1' } };

      const res = await controller.getAlerts(req);
      expect(alertsService.getAlerts).toHaveBeenCalledWith('u-1');
      expect(res).toHaveLength(1);
    });

    it('[POST /alerts] creates alert and broadcasts alert_created SSE event', async () => {
      alertsService.createAlert.mockResolvedValue({ id: 'alt-2', title: 'New message' });
      const req = { user: { uid: 'u-1' } };
      const body = { title: 'New message', body: 'Hello' };

      const res = await controller.createAlert(req, body);
      expect(alertsService.createAlert).toHaveBeenCalledWith('u-1', body);
      expect(eventsService.emit).toHaveBeenCalledWith({
        type: 'alert_created',
        userId: 'u-1',
        data: { id: 'alt-2', title: 'New message' },
      });
    });

    it('[PATCH /alerts/:id/read] marks alert as read and emits alert_updated SSE event', async () => {
      alertsService.markAlertRead.mockResolvedValue({ success: true });
      const req = { user: { uid: 'u-1' } };

      const res = await controller.markRead(req, 'alt-1');
      expect(alertsService.markAlertRead).toHaveBeenCalledWith('alt-1');
      expect(eventsService.emit).toHaveBeenCalledWith({
        type: 'alert_updated',
        userId: 'u-1',
        data: { id: 'alt-1', read: true },
      });
    });

    it('[DELETE /alerts/:id] deletes alert and emits alert_deleted SSE event', async () => {
      alertsService.deleteAlert.mockResolvedValue({ success: true });
      const req = { user: { uid: 'u-1' } };

      const res = await controller.deleteAlert(req, 'alt-1');
      expect(alertsService.deleteAlert).toHaveBeenCalledWith('alt-1');
      expect(eventsService.emit).toHaveBeenCalledWith({
        type: 'alert_deleted',
        userId: 'u-1',
        data: { id: 'alt-1' },
      });
    });

    it('[GET /alerts/events] subscribes user to real-time notification stream (SSE)', () => {
      const req = { user: { uid: 'u-1', email: 'u1@test.com', role: 'tenant' } };
      const stream$ = controller.sendAlertEvents(req);
      expect(eventsService.subscribe).toHaveBeenCalledWith('u-1', 'u1@test.com', 'tenant');
      expect(stream$).toBeDefined();
    });
  });
});

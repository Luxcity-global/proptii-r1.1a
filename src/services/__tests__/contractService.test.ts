import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import contractService, { contractPollingCoordinator } from '../contractService';
import sseService from '../sseService';
import apiService from '../api';

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../config/firebaseConfig', () => ({
  storage: {},
}));

describe('contractService with SSE and single polling coordinator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTemplates = [
    {
      id: 'template-1',
      userId: 'user-1',
      name: 'Standard AST Tenancy Agreement',
      uploadDate: '2026-08-19',
      fileData: 'stored_in_firebase_storage',
      fileUrl: 'https://example.com/template.pdf',
      fileSize: 10240,
      fileType: 'application/pdf',
      createdAt: '2026-08-19',
      updatedAt: '2026-08-19',
      status: 'active' as const,
      category: 'contract' as const,
    },
  ];

  it('subscribes to contract templates and receives initial data', async () => {
    vi.mocked(apiService.get).mockResolvedValue({
      data: { templates: mockTemplates },
    });

    const callback = vi.fn();
    const unsub = contractService.subscribeToUserContractTemplates('user-1', callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith(mockTemplates);
    });

    expect(apiService.get).toHaveBeenCalledWith('/contracts/templates?status=active');
    expect(contractPollingCoordinator.getActiveSubscriberCount()).toBe(1);

    unsub();
    expect(contractPollingCoordinator.getActiveSubscriberCount()).toBe(0);
  });

  it('refreshes contract data immediately upon receiving SSE contract event', async () => {
    vi.mocked(apiService.get).mockResolvedValue({
      data: { templates: mockTemplates },
    });

    const callback = vi.fn();
    const unsub = contractService.subscribeToUserContractTemplates('user-1', callback);

    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith(mockTemplates);
    });

    expect(apiService.get).toHaveBeenCalledTimes(1);

    // Simulate SSE event arrival
    sseService.dispatch({
      type: 'contract_template_updated',
      userId: 'user-1',
      data: { action: 'saved', templateId: 'template-2' },
    });

    await vi.waitFor(() => {
      expect(apiService.get).toHaveBeenCalledTimes(2);
    });

    unsub();
  });
});

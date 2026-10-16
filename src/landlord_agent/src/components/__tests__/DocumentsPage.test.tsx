import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentsPage } from '../DocumentsPage';
import { UserProfile } from '../../App';

vi.mock('../../../services/msalAccessToken', () => ({
  getAccessTokenForApiRequest: vi.fn().mockResolvedValue('test-token'),
}));

vi.mock('../../../config/apiBaseUrl', () => ({
  getResolvedApiBaseUrl: vi.fn().mockReturnValue('https://api.proptii.com/api'),
}));

vi.mock('../ui/alert-dialog', () => ({
  AlertDialog: ({ children, open }: any) => (open ? <div data-testid="alert-dialog">{children}</div> : null),
  AlertDialogContent: ({ children }: any) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div>{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div>{children}</div>,
  AlertDialogAction: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
  AlertDialogCancel: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

describe('DocumentsPage without properties', () => {
  beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  const mockUserProfile: UserProfile = {
    name: 'Alice Landlord',
    email: 'alice@example.com',
    phone: '07123456789',
  };

  it('renders Document Vault empty state and allows uploading when user has 0 properties', () => {
    render(
      <DocumentsPage
        properties={[]}
        unassignedDocuments={[]}
        userProfile={mockUserProfile}
        onViewProperty={vi.fn()}
        onManageDocuments={vi.fn()}
      />
    );

    // Should NOT show "Add your first property" shell
    expect(screen.queryByText('Add your first property')).not.toBeInTheDocument();

    // Should show Documents heading & empty state
    expect(screen.getByText('Your Documents')).toBeInTheDocument();
    expect(screen.getByText('No Documents in Vault Yet')).toBeInTheDocument();

    // Clicking Upload Document opens modal
    const uploadBtn = screen.getAllByRole('button', { name: /upload document/i })[0];
    fireEvent.click(uploadBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Upload Document — Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Don't assign to a property yet \(Save to Vault\)/i)).toBeInTheDocument();
    expect(screen.getByText(/No properties added yet. This document will be saved to your vault/i)).toBeInTheDocument();
  });

  it('auto-opens upload modal when openUploadOnMount is true even with 0 properties', () => {
    const onModalOpened = vi.fn();
    render(
      <DocumentsPage
        properties={[]}
        unassignedDocuments={[]}
        openUploadOnMount={true}
        onUploadModalOpened={onModalOpened}
        userProfile={mockUserProfile}
        onViewProperty={vi.fn()}
        onManageDocuments={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(onModalOpened).toHaveBeenCalled();
  });

  it('displays unassigned vault documents even when properties array is empty', () => {
    const unassignedDoc = {
      id: 'doc_1',
      landlordId: 'll_1',
      propertyId: null,
      name: 'Gas Safety Certificate 2026',
      type: 'epc',
      url: 'https://example.com/gas.pdf',
      issueDate: new Date('2026-01-01'),
      status: 'valid' as const,
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };

    render(
      <DocumentsPage
        properties={[]}
        unassignedDocuments={[unassignedDoc]}
        userProfile={mockUserProfile}
        onViewProperty={vi.fn()}
        onManageDocuments={vi.fn()}
      />
    );

    expect(screen.getByText('Gas Safety Certificate 2026')).toBeInTheDocument();
    expect(screen.getAllByText(/Unassigned Vault/i).length).toBeGreaterThan(0);
  });

  it('keeps document management in-place when filtering by all documents and clicking manage documents', () => {
    const mockProperty = {
      id: 'prop_1',
      address: '10 Baker Street, London NW1 6XE',
      rent: 2200,
      status: 'occupied' as const,
      images: [],
      documents: [
        {
          id: 'doc_101',
          name: 'Tenancy Agreement 2026',
          type: 'tenancy-agreement' as const,
          url: 'https://example.com/tenancy.pdf',
          issueDate: new Date('2026-01-01'),
          status: 'valid' as const,
        },
      ],
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };

    const onManageDocs = vi.fn();

    render(
      <DocumentsPage
        properties={[mockProperty as any]}
        unassignedDocuments={[]}
        userProfile={mockUserProfile}
        onViewProperty={vi.fn()}
        onManageDocuments={onManageDocs}
      />
    );

    // 1. Switch to "All Documents" tab
    const allDocsTab = screen.getByRole('tab', { name: /all documents/i });
    fireEvent.click(allDocsTab);

    expect(screen.getByText('Tenancy Agreement 2026')).toBeInTheDocument();

    // 2. Click "Manage documents" button on the document row/card
    const manageBtn = screen.getByTitle('Manage documents');
    fireEvent.click(manageBtn);

    // Verify it called onManageDocs with the property and stayed in-place
    expect(onManageDocs).toHaveBeenCalledWith(mockProperty);
    // View scope switched to By Property and filtered to this property
    expect(screen.getByRole('tab', { name: /by property/i })).toHaveAttribute('aria-selected', 'true');
  });

  it('initializes with initialPropertyId focused in By Property view', () => {
    const mockPropertyA = {
      id: 'prop_A',
      address: '10 Alpha Way, London',
      rent: 1800,
      status: 'occupied' as const,
      documents: [],
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };
    const mockPropertyB = {
      id: 'prop_B',
      address: '20 Beta Road, London',
      rent: 2500,
      status: 'vacant' as const,
      documents: [],
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-01-01'),
    };

    const onModalOpened = vi.fn();

    render(
      <DocumentsPage
        properties={[mockPropertyA as any, mockPropertyB as any]}
        unassignedDocuments={[]}
        initialPropertyId="prop_B"
        onUploadModalOpened={onModalOpened}
        userProfile={mockUserProfile}
        onViewProperty={vi.fn()}
      />
    );

    expect(screen.getByRole('tab', { name: /by property/i })).toHaveAttribute('aria-selected', 'true');
    const select = screen.getByRole('combobox', { name: /filter by property/i }) as HTMLSelectElement;
    expect(select.value).toBe('prop_B');
    expect(onModalOpened).toHaveBeenCalled();
  });
});


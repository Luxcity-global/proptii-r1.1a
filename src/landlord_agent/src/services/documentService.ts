/**
 * documentService — talks to POST/GET/PATCH/DELETE /api/documents
 *
 * Documents live in the landlord_documents Firestore collection.
 * propertyId is optional — null = unassigned.
 */
import { getResolvedApiBaseUrl } from '../../../config/apiBaseUrl';
import { getAccessTokenForApiRequest } from '../../../services/msalAccessToken';

const API_BASE = () => getResolvedApiBaseUrl();

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessTokenForApiRequest().catch(() => null);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export interface LandlordDocument {
  id: string;
  landlordId: string;
  propertyId: string | null;
  name: string;
  type: string;
  url: string;
  issueDate: Date;
  expiryDate?: Date | null;
  status: 'valid' | 'expiring-soon' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

function mapDoc(raw: any): LandlordDocument {
  return {
    id:         raw.id,
    landlordId: raw.landlordId,
    propertyId: raw.propertyId ?? null,
    name:       raw.name,
    type:       raw.type,
    url:        raw.url,
    issueDate:  new Date(raw.issueDate),
    expiryDate: raw.expiryDate ? new Date(raw.expiryDate) : null,
    status:     raw.status ?? 'valid',
    createdAt:  new Date(raw.createdAt),
    updatedAt:  new Date(raw.updatedAt),
  };
}

export const documentService = {

  /** Create a document record after its file has been uploaded to Firebase Storage */
  async createDocument(data: {
    name: string;
    type: string;
    url: string;
    issueDate: Date | string;
    expiryDate?: Date | string | null;
    propertyId?: string | null;
  }): Promise<LandlordDocument> {
    const res = await fetch(`${API_BASE()}/api/documents`, {
      method: 'POST',
      headers: await authHeaders(),
      body: JSON.stringify({
        name:       data.name,
        type:       data.type,
        url:        data.url,
        issueDate:  data.issueDate instanceof Date ? data.issueDate.toISOString() : data.issueDate,
        expiryDate: data.expiryDate instanceof Date ? data.expiryDate.toISOString() : (data.expiryDate ?? null),
        propertyId: data.propertyId ?? null,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to save document (${res.status}): ${text}`);
    }
    const json = await res.json();
    return mapDoc(json);
  },

  /** List all documents for the authenticated landlord, optionally filtered by property */
  async getDocuments(propertyId?: string | 'unassigned'): Promise<LandlordDocument[]> {
    const url = new URL(`${API_BASE()}/api/documents`);
    if (propertyId) url.searchParams.set('propertyId', propertyId);
    const res = await fetch(url.toString(), {
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to fetch documents (${res.status})`);
    const json = await res.json();
    return (json.documents ?? []).map(mapDoc);
  },

  /** Get only unassigned documents */
  async getUnassignedDocuments(): Promise<LandlordDocument[]> {
    return this.getDocuments('unassigned');
  },

  /** Assign a document to a property (or unassign by passing null) */
  async assignToProperty(documentId: string, propertyId: string | null): Promise<LandlordDocument> {
    const res = await fetch(`${API_BASE()}/api/documents/${documentId}/assign`, {
      method: 'PATCH',
      headers: await authHeaders(),
      body: JSON.stringify({ propertyId }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Failed to assign document (${res.status}): ${text}`);
    }
    const json = await res.json();
    return mapDoc(json.document);
  },

  /** Delete a document record */
  async deleteDocument(documentId: string): Promise<void> {
    const res = await fetch(`${API_BASE()}/api/documents/${documentId}`, {
      method: 'DELETE',
      headers: await authHeaders(),
    });
    if (!res.ok) throw new Error(`Failed to delete document (${res.status})`);
  },
};

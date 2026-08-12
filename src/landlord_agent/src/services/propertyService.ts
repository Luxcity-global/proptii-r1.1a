/**
 * Native Property Service
 *
 * Replaces the Firestore-based propertyService with calls to the Azure Functions API.
 * Image/document URLs continue to be served from Firebase Storage (upload unchanged).
 */
import { getAccessTokenForApiRequest } from '../../../services/msalAccessToken';
import { Property, PropertyPhoto, PropertyDocument } from '../App';

const API_BASE = (import.meta.env.VITE_NEST_API_ENDPOINT || 'http://localhost:3000').replace(/\/$/, '');

async function authHeaders(): Promise<Record<string, string>> {
    const token = await getAccessTokenForApiRequest().catch(() => null);
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

// ---------------------------------------------------------------------------
// Shape helpers — map API response to the internal Property type
// ---------------------------------------------------------------------------
function mapFromApi(data: any): Property {
    return {
        id: data.id ?? data._id,
        address: data.address ?? '',
        type: data.type ?? '',
        bedrooms: data.bedrooms ?? 1,
        bathrooms: data.bathrooms,
        squareFootage: data.squareFootage,
        rent: data.rent ?? 0,
        status: data.status ?? 'vacant',
        amenities: data.amenities ?? [],
        notes: data.notes ?? '',
        photos: (data.photos ?? []) as PropertyPhoto[],
        documents: (data.documents ?? []) as PropertyDocument[],
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        tenantId: data.tenantId,
        userId: data.userId,
    } as unknown as Property;
}

function mapToApi(property: Omit<Property, 'id' | 'createdAt' | 'tenant'>): Record<string, any> {
    const photos = (property.photos ?? []).map(p => ({
        id: p.id,
        url: p.url,
        filename: p.filename,
        isCover: p.isCover,
        ...(p.room ? { room: p.room } : {}),
    }));

    return {
        title: property.address,    // use address as title if no dedicated title field
        address: property.address,
        price: property.rent ? `£${property.rent.toLocaleString('en-GB')} pcm` : '£0 pcm',
        rent: property.rent,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        squareFootage: property.squareFootage,
        type: property.type,
        amenities: property.amenities ?? [],
        notes: property.notes ?? '',
        photos,
        documents: property.documents ?? [],
        status: property.status ?? 'vacant',
    };
}

// ---------------------------------------------------------------------------
// CRUD
// ---------------------------------------------------------------------------
class PropertyService {
    async createProperty(
        propertyData: Omit<Property, 'id' | 'createdAt' | 'tenant'>,
        ownerUserId: string,
        ownerEmail?: string
    ): Promise<string> {
        try {
            const headers = await authHeaders();
            const res = await fetch(`${API_BASE}/api/native-properties`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ ...mapToApi(propertyData), userId: ownerUserId, ownerEmail }),
            });
            if (res.ok) {
                const data = await res.json();
                return data.id || data._id || `prop-${Date.now()}`;
            }
        } catch (e) {
            console.warn('Backend createProperty fallback to local ID:', e);
        }
        return `prop-${Date.now()}`;
    }

    async getProperties(filters?: { status?: Property['status']; type?: string; userId?: string; email?: string }): Promise<Property[]> {
        const userId = filters?.userId;
        const email = filters?.email;
        if (!userId && !email) return [];
        
        const queryParams = new URLSearchParams();
        if (userId) queryParams.append('userId', userId);
        if (email) queryParams.append('email', email);

        const res = await fetch(`${API_BASE}/api/native-properties?${queryParams.toString()}`);
        if (!res.ok) throw new Error(`Failed to get properties (${res.status})`);
        const data: any[] = await res.json();
        let results = data.map(mapFromApi);
        if (filters?.status) results = results.filter(p => p.status === filters.status);
        if (filters?.type) results = results.filter(p => (p as any).type === filters.type);
        return results;
    }

    async getProperty(propertyId: string): Promise<Property | null> {
        const res = await fetch(`${API_BASE}/api/native-properties/${encodeURIComponent(propertyId)}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Failed to get property (${res.status})`);
        return mapFromApi(await res.json());
    }

    async updateProperty(
        propertyId: string,
        updates: Partial<Omit<Property, 'id' | 'createdAt' | 'tenant'>>
    ): Promise<void> {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE}/api/native-properties/${encodeURIComponent(propertyId)}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(updates),
        });
        if (!res.ok) throw new Error(`Failed to update property (${res.status})`);
    }

    async deleteProperty(propertyId: string): Promise<void> {
        const headers = await authHeaders();
        const res = await fetch(`${API_BASE}/api/native-properties/${encodeURIComponent(propertyId)}`, {
            method: 'DELETE',
            headers,
        });
        if (!res.ok) throw new Error(`Failed to delete property (${res.status})`);
    }

    // Stub — used by DocumentManagement component; images live in Firebase Storage, only URL stored
    async addDocumentToProperty(propertyId: string, document: Omit<PropertyDocument, 'id'>): Promise<void> {
        const existing = await this.getProperty(propertyId);
        if (!existing) throw new Error('Property not found');
        const newDoc: PropertyDocument = {
            id: `doc-${Date.now()}`,
            ...document,
        };
        await this.updateProperty(propertyId, {
            documents: [...(existing.documents ?? []), newDoc],
        } as any);
    }
}

export const propertyService = new PropertyService();

import { auth, db } from '../config/firebaseConfig';

const STORAGE_KEY = 'proptii.viewingInbox.v1';

function emailOf(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function titleKey(value: unknown): string {
  const text = String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (text.length < 4 || text === 'property viewing') return '';
  return text;
}

function titleKeys(value: unknown): string[] {
  const full = titleKey(value);
  if (!full) return [];
  const first = titleKey(full.split(',')[0]);
  return first && first !== full ? [full, first] : [full];
}

function readStored(): Record<string, any> {
  if (typeof localStorage === 'undefined') return {};
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Keep a local copy that still has the agent email after the API drops it. */
export function rememberViewings(items: any[]): void {
  if (!items?.length || typeof localStorage === 'undefined') return;
  try {
    const current = readStored();
    for (const item of items) {
      if (!item?.id) continue;
      current[item.id] = item;
    }
    const latest = Object.entries(current).slice(-100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(latest)));
  } catch {
    /* the landlord list still uses the API response */
  }
}

function asBooking(item: any) {
  const property = item?.property && typeof item.property === 'object' ? item.property : {};
  const details = item?.viewingDetails && typeof item.viewingDetails === 'object' ? item.viewingDetails : {};
  const userDetails = details.userDetails && typeof details.userDetails === 'object' ? details.userDetails : {};
  return {
    ...item,
    property: {
      street: property.street || item.propertyTitle || 'Property viewing',
      town: property.town || '',
      city: property.city || '',
      postcode: property.postcode || '',
      agent: {
        id: property.agent?.id || item.agentId || '',
        name: property.agent?.name || '',
        email: property.agent?.email || item.agentEmail || '',
        phone: property.agent?.phone || '',
        company: property.agent?.company || '',
      },
    },
    viewingDetails: {
      date: details.date || item.requestedDate || '',
      time: details.time || item.requestedTime || '',
      preference: details.preference || 'In-Person Viewing',
      userDetails: {
        fullName: userDetails.fullName || '',
        email: userDetails.email || item.tenantEmail || '',
        phoneNumber: userDetails.phoneNumber || '',
      },
    },
  };
}

function isForLandlord(
  item: any,
  uids: string[],
  email: string,
  titles: Set<string>,
): boolean {
  const ids = [item?.userId, item?.tenantId, item?.landlordId, item?.agentId, item?.property?.agent?.id];
  if (uids.some((uid) => uid && ids.includes(uid))) return true;
  const emails = [
    item?.agentEmail,
    item?.landlordEmail,
    item?.tenantEmail,
    item?.property?.agent?.email,
    item?.viewingDetails?.userDetails?.email,
  ].map(emailOf).filter(Boolean);
  if (email && emails.includes(email)) return true;
  const keys = [
    ...titleKeys(item?.propertyTitle),
    ...titleKeys(item?.property?.street),
    ...titleKeys(item?.address),
  ];
  return keys.some((key) => titles.has(key));
}

async function docsWhere(collectionName: string, field: string, value: string): Promise<any[]> {
  if (!value) return [];
  const { collection, getDocs, query, where } = await import('firebase/firestore');
  const snapshot = await getDocs(query(collection(db, collectionName), where(field, '==', value)));
  return snapshot.docs.map((row) => ({ id: row.id, ...row.data() }));
}

async function safeDocs(collectionName: string, field: string, value: string): Promise<any[]> {
  try {
    return await docsWhere(collectionName, field, value);
  } catch {
    return [];
  }
}

/**
 * Bookings saved for this agent email, this account, or one of this landlord's properties.
 * The live list API only returns a landlord id, so these copies fill that gap.
 */
export async function listViewingsForLandlord(options: {
  uid?: string | null;
  extraIds?: Array<string | null | undefined>;
  email?: string | null;
  propertyTitles?: string[];
}): Promise<any[]> {
  const uids = [...new Set([options.uid, ...(options.extraIds || [])].map((id) => String(id || '')).filter(Boolean))];
  const email = emailOf(options.email);
  const titles = new Set(
    (options.propertyTitles || []).flatMap((title) => titleKeys(title)),
  );
  const byId = new Map<string, any>();
  const add = (item: any) => {
    if (!item?.id || byId.has(item.id)) return;
    if (!isForLandlord(item, uids, email, titles)) return;
    byId.set(item.id, asBooking(item));
  };

  Object.values(readStored()).forEach(add);

  const lookups: Array<Promise<any[]>> = [];
  for (const collectionName of ['viewingBookings', 'viewings']) {
    for (const id of uids) {
      for (const field of ['userId', 'tenantId', 'landlordId', 'agentId']) {
        lookups.push(safeDocs(collectionName, field, id));
      }
    }
    for (const field of ['agentEmail', 'landlordEmail', 'tenantEmail']) {
      lookups.push(safeDocs(collectionName, field, email));
    }
  }
  const groups = await Promise.all(lookups);
  groups.flat().forEach(add);
  return Array.from(byId.values());
}

/** So the landlord can open the booking from their email even when the API omits it. */
export async function publishViewingCopy(item: any): Promise<void> {
  if (!item) return;
  const authUser = auth.currentUser;
  const uid = authUser?.uid || item.userId || item.tenantId || '';
  const agentEmail = emailOf(item.agentEmail || item.property?.agent?.email);
  const id = item.id || `viewing_${uid || 'guest'}_${Date.now()}`;
  const copy = {
    ...item,
    id,
    userId: item.userId || item.tenantId || uid,
    tenantId: item.tenantId || uid,
    agentEmail: agentEmail || null,
    landlordEmail: emailOf(item.landlordEmail) || agentEmail || null,
  };
  rememberViewings([copy]);
  if (!db || !copy.userId) return;
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const payload = JSON.parse(JSON.stringify(copy));
    await setDoc(doc(db, 'viewingBookings', id), payload, { merge: true });
  } catch {
    /* local copy still feeds the landlord list in this browser */
  }
}

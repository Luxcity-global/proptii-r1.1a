/**
 * Collapse duplicate client rows that describe the same person on the same property.
 * A second property for the same email stays as its own tenancy.
 *
 * Keep in sync with src/landlord_agent/src/services/dedupeTenants.ts.
 */

export interface DedupeTenant {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  propertyId?: string;
  propertyAddress?: string;
  status?: string;
  rentAmount?: number;
  updatedAt?: string | Date | null;
  referencingStatus?: string;
}

function normEmail(email?: string): string {
  return (email || '').trim().toLowerCase();
}

function normAddr(address?: string): string {
  return (address || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function realPropertyId(tenant: DedupeTenant): string {
  const id = (tenant.propertyId || '').trim();
  if (!id || id === 'setup-property') return '';
  return id;
}

function isAnchored(tenant: DedupeTenant): boolean {
  return Boolean(realPropertyId(tenant) || normAddr(tenant.propertyAddress));
}

function sameTenancy(a: DedupeTenant, b: DedupeTenant): boolean {
  const idA = realPropertyId(a);
  const idB = realPropertyId(b);
  if (idA && idB) return idA === idB;

  const addrA = normAddr(a.propertyAddress);
  const addrB = normAddr(b.propertyAddress);
  if (addrA && addrB) return addrA === addrB;

  return false;
}

function timestamp(value: DedupeTenant['updatedAt']): number {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function score(tenant: DedupeTenant): number {
  let value = 0;
  const status = (tenant.status || '').toLowerCase();
  if (status === 'active') value += 50;
  else if (status === 'pending') value += 5;
  else if (status) value += 10;

  if ((tenant.rentAmount || 0) > 0) value += 20;
  if ((tenant.phone || '').trim()) value += 5;

  const email = normEmail(tenant.email);
  const name = (tenant.name || '').trim().toLowerCase();
  const localPart = email.split('@')[0];
  if (name && name !== localPart && name !== email) value += 15;

  if (realPropertyId(tenant)) value += 10;
  if ((tenant.referencingStatus || '') === 'complete') value += 5;
  return value;
}

function better(candidate: DedupeTenant, current: DedupeTenant): boolean {
  const candidateScore = score(candidate);
  const currentScore = score(current);
  if (candidateScore !== currentScore) return candidateScore > currentScore;
  return timestamp(candidate.updatedAt) > timestamp(current.updatedAt);
}

function withProperty<T extends DedupeTenant>(winner: T, other: T): T {
  const winnerId = realPropertyId(winner);
  const otherId = realPropertyId(other);
  const winnerAddr = normAddr(winner.propertyAddress);
  const otherAddr = normAddr(other.propertyAddress);

  if (!winnerId && otherId) {
    return {
      ...winner,
      propertyId: other.propertyId,
      propertyAddress: winner.propertyAddress || other.propertyAddress,
    };
  }

  if (!winnerAddr && otherAddr && !winnerId) {
    return {
      ...winner,
      propertyId: winner.propertyId || other.propertyId,
      propertyAddress: other.propertyAddress,
    };
  }

  return winner;
}

function cluster<T extends DedupeTenant>(items: T[]): T[][] {
  const parent = items.map((_, index) => index);
  const find = (index: number): number => {
    let root = index;
    while (parent[root] !== root) root = parent[root];
    let cursor = index;
    while (parent[cursor] !== root) {
      const next = parent[cursor];
      parent[cursor] = root;
      cursor = next;
    }
    return root;
  };

  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      if (!sameTenancy(items[i], items[j])) continue;
      const left = find(i);
      const right = find(j);
      if (left !== right) parent[right] = left;
    }
  }

  const groups = new Map<number, T[]>();
  items.forEach((item, index) => {
    const root = find(index);
    const list = groups.get(root) || [];
    list.push(item);
    groups.set(root, list);
  });
  return Array.from(groups.values());
}

function pick<T extends DedupeTenant>(members: T[]): T {
  return members.reduce((winner, candidate) => (
    better(candidate, winner) ? withProperty(candidate, winner) : withProperty(winner, candidate)
  ));
}

export function dedupeTenants<T extends DedupeTenant>(tenants: T[]): T[] {
  if (tenants.length < 2) return tenants.slice();

  const passthrough: { tenant: T; index: number }[] = [];
  const byEmail = new Map<string, { tenant: T; index: number }[]>();

  tenants.forEach((tenant, index) => {
    const email = normEmail(tenant.email);
    if (!email) {
      passthrough.push({ tenant, index });
      return;
    }
    const group = byEmail.get(email) || [];
    group.push({ tenant, index });
    byEmail.set(email, group);
  });

  const chosen: { tenant: T; index: number }[] = [...passthrough];

  for (const group of byEmail.values()) {
    const anchored = group.filter((item) => isAnchored(item.tenant));
    const loose = group.filter((item) => !isAnchored(item.tenant));
    const anchoredClusters = cluster(anchored.map((item) => item.tenant));

    const clusters: T[][] = anchoredClusters.map((members) => members.slice());
    if (clusters.length === 0) {
      if (loose.length) clusters.push(loose.map((item) => item.tenant));
    } else if (clusters.length === 1) {
      clusters[0].push(...loose.map((item) => item.tenant));
    } else if (loose.length) {
      clusters.push(loose.map((item) => item.tenant));
    }

    clusters.forEach((members) => {
      const winner = pick(members);
      const index = members.reduce((earliest, member) => {
        const memberIndex = tenants.indexOf(member);
        return memberIndex >= 0 && memberIndex < earliest ? memberIndex : earliest;
      }, Number.POSITIVE_INFINITY);
      chosen.push({ tenant: winner, index });
    });
  }

  chosen.sort((a, b) => a.index - b.index);
  return chosen.map((item) => item.tenant);
}

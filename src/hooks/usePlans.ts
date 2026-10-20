import { useEffect, useState } from 'react';
import { PLANS, type PlanConfig } from '../config/plans';
import { fetchBillingWithApiFallback } from '../utils/apiEndpoints';

let _cache: PlanConfig[] | null = null;
let _cacheTime = 0;

async function fetchLivePlans(): Promise<PlanConfig[]> {
  if (_cache && Date.now() - _cacheTime < 5 * 60 * 1000) return _cache;
  try {
    const { response } = await fetchBillingWithApiFallback('/billing/plans');
    if (!response.ok) throw new Error('plans fetch failed');
    const live = await response.json() as Array<any>;
    const merged = PLANS.map((p) => {
      const l = live.find((x: any) => x.id === p.id);
      if (!l) return p;
      return {
        ...p,
        monthlyPrice: l.monthlyPrice ?? p.monthlyPrice,
        annualPrice: l.annualPrice ?? p.annualPrice,
        annualTotal: l.annualTotal ?? p.annualTotal,
        annualSaving: l.annualSaving ?? p.annualSaving,
        stripePriceIdMonthly: l.stripePriceIdMonthly ?? p.stripePriceIdMonthly,
        stripePriceIdAnnual: l.stripePriceIdAnnual ?? p.stripePriceIdAnnual,
      };
    });
    _cache = merged;
    _cacheTime = Date.now();
    return merged;
  } catch {
    return PLANS;
  }
}

export function usePlans() {
  const [plans, setPlans] = useState<PlanConfig[]>(PLANS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLivePlans()
      .then((result) => { if (!cancelled) { setPlans(result); setError(null); } })
      .catch((e: any) => { if (!cancelled) setError(e?.message ?? 'Failed to load plans'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { plans, loading, error };
}

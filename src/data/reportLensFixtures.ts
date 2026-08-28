import type { Audience, ReportLens } from '../types/govData';

export function mockReportLens(audience: Audience | null): ReportLens {
  const role = audience || 'tenant';
  const copy: Record<Audience, ReportLens> = {
    tenant: {
      severity: 'caution',
      verdictText:
        'HM Land Registry or EPC registers noted restrictions relevant to tenant obligations.',
      steps: [
        'Ask the agent to confirm whether pet covenants can be waived in writing',
        'Request the latest EPC certificate and gas safety record before paying a holding deposit',
        'Verify the deposit will be protected in an approved scheme within 30 days',
      ],
    },
    buyer: {
      severity: 'info',
      verdictText:
        'As a buyer, treat flagged title and EPC items as conveyancing follow-ups, not deal-breakers by default.',
      steps: [
        'Share flagged covenants with your solicitor before exchange',
        'Request the full title plan and any freeholder restrictions',
        'Budget for any EPC improvements hinted by the register',
      ],
    },
    landlord: {
      severity: 'alert',
      verdictText:
        'As a landlord, flagged compliance items may block a compliant let until resolved.',
      steps: [
        'Resolve unresolved title or safety flags before marketing',
        'Confirm EPC meets the legal minimum for new tenancies',
        'Document flood and covenant disclosures for applicants',
      ],
    },
    agent: {
      severity: 'info',
      verdictText:
        'As an agent, surface unresolved facts honestly — never present missing data as clear.',
      steps: [
        'Disclose flagged and unresolved items in particulars (CPR Parts A–C)',
        'Chase the landlord for missing certificates before viewings',
        'Keep the facts row unchanged when switching audience lens',
      ],
    },
    homeowner: {
      severity: 'info',
      verdictText:
        'As a homeowner, use this lens to prioritise maintenance and insurance follow-ups.',
      steps: [
        'Review flood and title flags with your insurer',
        'Plan EPC improvements if selling or remortgaging',
        'Keep records of any remedial works',
      ],
    },
  };
  return copy[role];
}

import type { PricingAudience } from '../../utils/pricingRoutes';

export type CompareRow =
  | { type: 'section'; label: string }
  | {
      type: 'row';
      feature: string;
      cols: (string | 'yes' | 'no' | { partial: string })[];
    };

export const COMPARE_DATA: Record<
  PricingAudience,
  { headers: string[]; rows: CompareRow[] }
> = {
  renters: {
    headers: ['Explorer', 'Renter Pro', 'Buyer Pro'],
    rows: [
      { type: 'section', label: 'Search & viewings' },
      { type: 'row', feature: 'Property search', cols: ['yes', 'yes', 'yes'] },
      { type: 'row', feature: 'Viewing booking', cols: ['yes', 'yes', 'yes'] },
      {
        type: 'row',
        feature: 'Saved searches',
        cols: [{ partial: '5 only' }, 'yes', 'yes'],
      },
      { type: 'section', label: 'Fit & referencing' },
      {
        type: 'row',
        feature: 'Basic fit indicators',
        cols: ['yes', 'yes', 'yes'],
      },
      {
        type: 'row',
        feature: 'Full fit reports',
        cols: [{ partial: '1 only' }, 'yes', 'yes'],
      },
      {
        type: 'row',
        feature: 'Full referencing suite',
        cols: ['no', 'yes', 'yes'],
      },
      {
        type: 'row',
        feature: 'Report history & alerts',
        cols: ['no', 'yes', 'yes'],
      },
      { type: 'section', label: 'Buyer tools' },
      {
        type: 'row',
        feature: 'Property intelligence reports',
        cols: ['no', 'no', 'yes'],
      },
      {
        type: 'row',
        feature: 'Title register & risk data',
        cols: ['no', 'no', 'yes'],
      },
      { type: 'row', feature: 'Area intelligence', cols: ['no', 'no', 'yes'] },
      {
        type: 'row',
        feature: 'Conveyancer matching',
        cols: ['no', 'no', 'yes'],
      },
    ],
  },
  landlords: {
    headers: ['Starter', 'Landlord Pro', 'Elite'],
    rows: [
      { type: 'section', label: 'Properties' },
      {
        type: 'row',
        feature: 'Properties managed',
        cols: [{ partial: 'Up to 2' }, { partial: 'Up to 10' }, 'yes'],
      },
      { type: 'row', feature: 'Tenant fit checks', cols: ['yes', 'yes', 'yes'] },
      {
        type: 'row',
        feature: 'Unlimited fit checks',
        cols: ['no', 'yes', 'yes'],
      },
      { type: 'section', label: 'Contracts & documents' },
      {
        type: 'row',
        feature: 'AST digital contracts',
        cols: ['yes', 'yes', 'yes'],
      },
      {
        type: 'row',
        feature: 'Full contract suite',
        cols: ['no', 'yes', 'yes'],
      },
      { type: 'section', label: 'Dashboard & analytics' },
      {
        type: 'row',
        feature: 'Portfolio dashboard',
        cols: [{ partial: 'Basic' }, 'yes', 'yes'],
      },
      {
        type: 'row',
        feature: 'Revenue forecasting',
        cols: ['no', 'no', 'yes'],
      },
      { type: 'row', feature: 'API access', cols: ['no', 'no', 'yes'] },
    ],
  },
  agents: {
    headers: ['Independent', 'Agent Pro', 'Enterprise'],
    rows: [
      { type: 'section', label: 'Users & quota' },
      {
        type: 'row',
        feature: 'Users',
        cols: [{ partial: '1' }, { partial: 'Up to 5' }, 'yes'],
      },
      {
        type: 'row',
        feature: 'Monthly fit checks',
        cols: [
          { partial: '20 included' },
          { partial: '100 included' },
          'yes',
        ],
      },
      {
        type: 'row',
        feature: 'Overage rate',
        cols: [
          { partial: '£4/check' },
          { partial: '£3/check' },
          { partial: 'Volume rate' },
        ],
      },
      { type: 'section', label: 'Tools & compliance' },
      {
        type: 'row',
        feature: 'Client pipeline view',
        cols: ['yes', 'yes', 'yes'],
      },
      { type: 'row', feature: 'Digital contracts', cols: ['yes', 'yes', 'yes'] },
      {
        type: 'row',
        feature: 'Material info compliance',
        cols: ['no', 'yes', 'yes'],
      },
      {
        type: 'row',
        feature: 'Intelligence reports',
        cols: ['no', 'yes', 'yes'],
      },
      { type: 'section', label: 'Enterprise' },
      {
        type: 'row',
        feature: 'White-label reports',
        cols: ['no', 'no', 'yes'],
      },
      { type: 'row', feature: 'API integration', cols: ['no', 'no', 'yes'] },
      { type: 'row', feature: 'Dedicated CSM', cols: ['no', 'no', 'yes'] },
    ],
  },
};

export const PRICING_FAQS = [
  {
    q: 'What does the early access free month mean?',
    a: "If you sign up to any paid plan before 31 July 2026, your first full month is free — no credit card charge, no catch. You can cancel at any time during that month and you won't pay a thing. After your free month, you'll move onto your chosen plan at the regular price.",
  },
  {
    q: 'Is annual billing really worth it?',
    a: "Yes — you save 20% versus monthly billing. For Landlord Pro, that's over £80 a year. You're billed once upfront and your plan renews at the same rate.",
  },
  {
    q: 'What are fit reports and when do they launch?',
    a: "Fit reports are Proptii's core intelligence product — they tell renters, buyers, landlords, and agents how well a profile matches a property or financial requirement, before anyone commits time. They launch in May 2026 and will be available automatically on all paid plans at no extra cost.",
  },
  {
    q: 'How do agent quota overages work?',
    a: "Each agent plan includes a monthly quota of fit checks. If you exceed it, you're charged a flat per-check rate (£4 for Independent, £3 for Agent Pro) added to your next invoice. There's no manual upgrade required — you just keep working, and the bill reflects your actual usage.",
  },
  {
    q: 'Can I switch plans later?',
    a: "Yes, always. Upgrade at any time and the difference is prorated. Downgrade at the end of your billing cycle. We don't make this difficult.",
  },
  {
    q: 'Are tenants really free forever?',
    a: 'Core search, viewings, and basic fit indicators are free forever for renters and buyers. The paid tiers unlock the full fit report suite, complete referencing, report alerts, and buyer intelligence tools.',
  },
];

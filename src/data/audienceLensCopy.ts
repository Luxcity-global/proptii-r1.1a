/**
 * Proptii Release 1.4 — Intelligence Layer Data & Copy Matrix
 * Sprints 1.2, 3.2, 3.3, and 4.1
 *
 * Rules:
 * - 5 Audiences: 'tenant' | 'buyer' | 'landlord' | 'agent' | 'homeowner' (strictly "tenant", never "renter")
 * - 2 r1.4 Flags: 'restrictive_covenant' | 'epc_context'
 * - 3 Flag States: 'clear' | 'flagged' | 'unresolved' (unresolved != clear; plain truth)
 * - Freshness: HMLR & OS -> "refreshed this month"; EPC -> "refreshed this month" (batch) or "verified today (landlord uploaded)"
 * - Definitional terms link to /tools/know-your-rights
 * - Pure Lucide SVG icons used (no emojis)
 */

export type AudienceLens = 'tenant' | 'buyer' | 'landlord' | 'agent' | 'homeowner';

export type FlagType = 'restrictive_covenant' | 'epc_context';

export type FlagState = 'clear' | 'flagged' | 'unresolved';

export interface FlagIntelligence {
  flagType: FlagType;
  title: string;
  source: string;
  cadence: string;
  state: FlagState;
  dataValue?: string;
  freshness: string;
}

export interface AudienceLensCopy {
  audience: AudienceLens;
  audienceLabel: string;
  verdict: string;
  recommendedSteps: string[];
  knowYourRightsLink?: string;
}

export interface PropertyRiskAssessment {
  uprnMatched: boolean;
  titleNumber?: string;
  uprn?: string;
  flags: {
    restrictive_covenant: FlagIntelligence;
    epc_context: FlagIntelligence;
  };
}

/**
 * Sprint 1.2 & 3.2 — 10 Audience-Lens Copy Combinations Matrix
 * (2 Flags × 5 Audiences) across clear, flagged, and unresolved states.
 */
export const AUDIENCE_LENS_COPY: Record<
  FlagType,
  Record<AudienceLens, Record<FlagState, { verdict: string; steps: string[] }>>
> = {
  // Flag 1: Restrictive Covenant on Title (HM Land Registry)
  restrictive_covenant: {
    tenant: {
      clear: {
        verdict: 'No restrictive covenants found that limit residential tenant occupancy or quiet enjoyment.',
        steps: [
          'Standard tenancy rules apply; check tenancy agreement for landlord house rules.',
          'No title-level restrictions on vehicle parking or work-from-home activities.'
        ]
      },
      flagged: {
        verdict: 'Title register contains restrictive covenants (e.g., pet exclusions, trade restrictions, or parking limits) that may affect tenant use.',
        steps: [
          'Verify with landlord or agent if building-level covenants override lease permissions.',
          'Review pet, musical instrument, or parking restrictions in the draft tenancy agreement before signing.',
          'Read your statutory rights regarding reasonable covenants in Know Your Rights.'
        ]
      },
      unresolved: {
        verdict: 'HM Land Registry search did not return a definitive registered title record for this exact unit.',
        steps: [
          'This is not a clean pass — title data could not be verified automatically.',
          'Ask the agent or landlord for the registered Land Registry Title Number.'
        ]
      }
    },
    buyer: {
      clear: {
        verdict: 'HMLR title search confirms a clean register free of unusual restrictive burdens or freehold covenants.',
        steps: [
          'Instruct your conveyancer to verify the Title Plan boundary against physical boundary markers.',
          'Obtain official copies of the Title Register (OC1) during standard legal searches.'
        ]
      },
      flagged: {
        verdict: 'Title register records active restrictive covenants affecting property alterations, commercial use, or boundary maintenance.',
        steps: [
          'Request an official copy of the charges register from the seller’s conveyancer.',
          'Assess whether intended extensions or modifications require covenant consent or indemnity insurance.',
          'Consult your solicitor regarding potential covenant modification via the Upper Tribunal (Lands Chamber).'
        ]
      },
      unresolved: {
        verdict: 'No conclusive Title Register match was returned by HM Land Registry for this address.',
        steps: [
          'This property cannot be confirmed as clear without manual title extraction.',
          'Request the seller conveyancer’s title packet and UPRN reference prior to making an offer.'
        ]
      }
    },
    landlord: {
      clear: {
        verdict: 'Title is clear of restrictive covenants that would impede residential letting or standard tenancy structuring.',
        steps: [
          'Ensure your standard AST or tenancy contract aligns with statutory landlord obligations.',
          'Retain digital title extract in your Proptii compliance locker.'
        ]
      },
      flagged: {
        verdict: 'Title contains restrictive terms that may limit multi-occupancy, subletting, holiday lets, or exterior modifications.',
        steps: [
          'Confirm that tenancy terms do not permit tenant breaches of underlying head-lease covenants.',
          'Review whether HMO licensing or specific tenant clauses are prohibited by the title deeds.',
          'Check indemnity insurance coverage for any historic covenant variations.'
        ]
      },
      unresolved: {
        verdict: 'HM Land Registry returned no matched digital title deed for this property.',
        steps: [
          'Upload your official Title Plan or Land Registry deed directly to resolve this record today.',
          'Ensure property UPRN matches local authority land charges registers.'
        ]
      }
    },
    agent: {
      clear: {
        verdict: 'Material Information (Part C): Title register verified clear of unusual restrictive covenants.',
        steps: [
          'Include standard title verification in your compliance disclosure pack.',
          'Archive timestamped Land Registry extract in client auditing file.'
        ]
      },
      flagged: {
        verdict: 'Material Information Notice: Restrictive covenants present on title register that must be disclosed under CPR regulations.',
        steps: [
          'Disclose key covenant terms (e.g. business use prohibitions, parking covenants) in listing details.',
          'Prompt prospective buyers or tenants to review covenant restrictions with legal counsel.',
          'Generate evidentiary disclosure record for internal compliance auditing.'
        ]
      },
      unresolved: {
        verdict: 'HMLR title search unresolved for this listing. Source returned no definitive record.',
        steps: [
          'Do not market as verified clear; obtain title number from vendor/landlord.',
          'Mark listing compliance status as pending title verification.'
        ]
      }
    },
    homeowner: {
      clear: {
        verdict: 'Your property title is clear of registered restrictive covenants on the Land Registry charges register.',
        steps: [
          'Standard permitted development rights apply subject to local planning authority rules.',
          'Keep your digital title extract up-to-date in your home management portal.'
        ]
      },
      flagged: {
        verdict: 'Your title contains recorded restrictive covenants that may govern future structural alterations, annexes, or business use.',
        steps: [
          'Review deed terms before commissioning major building works or tree removals.',
          'Consult a property solicitor or consider restrictive covenant indemnity insurance if planning extensions.',
          'Read guidance on covenant discharge in Know Your Rights.'
        ]
      },
      unresolved: {
        verdict: 'Land Registry search could not match your title automatically.',
        steps: [
          'Link your HMLR Title Number or upload deeds to unlock your property health record.',
          'Verify your address formatting matches Ordnance Survey postal records.'
        ]
      }
    }
  },

  // Flag 2: EPC in Context of Building Age & Statutory Compliance
  epc_context: {
    tenant: {
      clear: {
        verdict: 'Valid Energy Performance Certificate registered (Rating: Band C or higher, appropriate for construction period).',
        steps: [
          'Energy efficiency meets recommended benchmarks; estimated heating costs within standard bracket.',
          'Request a full copy of the valid EPC certificate from landlord/agent if not already provided.'
        ]
      },
      flagged: {
        verdict: 'EPC rating indicates poor thermal performance relative to building era, with potential high heating expenditure.',
        steps: [
          'Inquire about heating type (electric storage vs gas combi) and average winter utility bills.',
          'Confirm that property meets the statutory Minimum Energy Efficiency Standard (MEES) of Band E or above.',
          'Review tenant energy advice and cold home rights in Know Your Rights.'
        ]
      },
      unresolved: {
        verdict: 'EPC Register search returned no valid, current Energy Performance Certificate for this address.',
        steps: [
          'This is not a verified pass — letting a property without a valid EPC may be unlawful.',
          'Request an active EPC link or certificate from the letting agent before signing.'
        ]
      }
    },
    buyer: {
      clear: {
        verdict: 'EPC assessment is current with solid thermal efficiency rating aligned with modern building regulations.',
        steps: [
          'Review recommended energy efficiency improvements and estimated payback periods.',
          'Incorporate EPC advisory recommendations into long-term renovation budgeting.'
        ]
      },
      flagged: {
        verdict: 'Property energy rating is sub-optimal (Band E, F, or G) for its architectural era, indicating retrofit investment required.',
        steps: [
          'Commission a Level 3 RICS building survey to assess insulation, glazing, and heating system condition.',
          'Factor required energy upgrades (e.g. wall insulation, heat pump, boiler replacement) into offer negotiation.',
          'Check eligibility for government retrofit grants (e.g. ECO4, Boiler Upgrade Scheme).'
        ]
      },
      unresolved: {
        verdict: 'No Energy Performance Certificate found on the national EPC register for this building/UPRN.',
        steps: [
          'Require seller to commission and furnish a valid EPC before contracts are exchanged.',
          'Verify whether the property has a statutory EPC exemption (e.g. specific listed building status).'
        ]
      }
    },
    landlord: {
      clear: {
        verdict: 'Property meets current MEES compliance (Band E+) and is on trajectory for proposed Future Homes EPC standards.',
        steps: [
          'Store EPC expiry date in Proptii compliance schedule for automatic re-certification alerts.',
          'Share certified EPC copy with incoming tenants as required under Section 21 prerequisites.'
        ]
      },
      flagged: {
        verdict: 'EPC rating is borderline or below MEES requirements, carrying legal letting restrictions or impending upgrade deadlines.',
        steps: [
          'Review the EPC recommendation report for cost-effective capital energy improvements.',
          'Ensure valid exemption is registered on the PRS Exemptions Register if statutory cap is reached.',
          'Obtain quotes for energy efficiency works prior to next tenancy renewal.'
        ]
      },
      unresolved: {
        verdict: 'No active EPC lodged on the Government EPC Register for this rental property.',
        steps: [
          'Upload your valid EPC certificate today, or book an accredited domestic energy assessor.',
          'Note: Serving a Section 21 notice requires a valid EPC to be served on the tenant.'
        ]
      }
    },
    agent: {
      clear: {
        verdict: 'Material Information (Part B): EPC rating compliant and validly registered for marketing.',
        steps: [
          'Display official EPC graph and energy rating prominently on all portal listings.',
          'Attach compliance certificate to applicant viewing packs.'
        ]
      },
      flagged: {
        verdict: 'Material Information Notice: EPC rating requires explicit disclosure and may impact landlord statutory compliance.',
        steps: [
          'Verify that the property possesses a lawful MEES rating (or registered exemption) prior to tenancy commencement.',
          'Advise prospective applicants of energy efficiency rating and potential utility implications.',
          'Generate evidentiary disclosure export for audit record.'
        ]
      },
      unresolved: {
        verdict: 'No EPC found on government register. Listing cannot be marked as EPC-compliant.',
        steps: [
          'Request EPC certificate from landlord prior to launching full marketing campaign.',
          'Remind landlord of legal requirement to obtain EPC within 28 days of marketing.'
        ]
      }
    },
    homeowner: {
      clear: {
        verdict: 'Your home holds an active EPC with healthy efficiency ratings and lower estimated carbon footprint.',
        steps: [
          'Review EPC recommendations for high-impact home energy improvements.',
          'Track potential home value increase from green mortgage eligibility.'
        ]
      },
      flagged: {
        verdict: 'EPC shows notable heat loss and efficiency bottlenecks typical of its construction vintage.',
        steps: [
          'Explore low-cost improvements: loft insulation, smart thermostats, and draught-proofing.',
          'Review national energy grant schemes for heat pumps and solar PV installations.',
          'Consult Know Your Rights for guidance on energy efficiency ratings.'
        ]
      },
      unresolved: {
        verdict: 'No EPC on file with the national register for your property address.',
        steps: [
          'Commission a certified domestic energy assessment or link an existing certificate.',
          'EPC is valid for 10 years and required if you decide to sell or let your home.'
        ]
      }
    }
  }
};

/**
 * Audience metadata
 */
export const AUDIENCE_METADATA: Record<
  AudienceLens,
  { label: string; description: string; roleType: string }
> = {
  tenant: {
    label: 'Tenant',
    description: 'Renting rights, living rules, utility costs & deposit protection',
    roleType: 'Residential Tenant'
  },
  buyer: {
    label: 'Buyer',
    description: 'Freehold title, legal covenants, structural condition & value',
    roleType: 'Prospective Buyer'
  },
  landlord: {
    label: 'Landlord',
    description: 'Statutory compliance, MEES regulations, tenancy structuring',
    roleType: 'Property Owner / Landlord'
  },
  agent: {
    label: 'Agent',
    description: 'Material Information Parts A/B/C, CPR compliance & disclosure',
    roleType: 'Estate / Letting Agent'
  },
  homeowner: {
    label: 'Homeowner',
    description: 'Deed protections, permitted development, green upgrade grants',
    roleType: 'Owner Occupier'
  }
};

/**
 * Freshness helpers matching Section 5 rules
 */
export const getFreshnessString = (source: 'HMLR' | 'OS' | 'EPC', isLandlordUploaded = false): string => {
  if (source === 'EPC' && isLandlordUploaded) {
    return 'verified today (landlord uploaded)';
  }
  if (source === 'HMLR' || source === 'OS' || source === 'EPC') {
    return 'refreshed this month';
  }
  return 'refreshed this month';
};

/**
 * Sprint 4.1 — Expanded General Enquiry Database & Intelligent Guidance System
 */
export interface ActionSearchChip {
  label: string;
  searchQuery: string;
  iconName?: string;
}

export interface GeneralEnquiryResponse {
  id: string;
  isAnswerable: boolean;
  topic?: string;
  category?: 'legal' | 'efficiency' | 'compliance' | 'finance' | 'safety' | 'broad_search';
  perspectives?: {
    tenant: string;
    landlord: string;
    agent: string;
  };
  briefAnswer?: string;
  callToAction?: string;
  actionChips?: ActionSearchChip[];
  isTooBroad?: boolean;
  clarifyingQuestion?: string;
  quickReplyChips?: string[];
  budgetChips?: string[];
  propertyTypeChips?: string[];
}

export const GENERAL_ENQUIRY_DATABASE: Record<string, GeneralEnquiryResponse> = {
  // 1. Pets & Animals in Leases
  pets: {
    id: 'pets',
    isAnswerable: true,
    topic: 'Pet Permissions & Lease Covenants',
    category: 'legal',
    perspectives: {
      tenant: 'Under the Renters (Reform) Bill guidance, landlords cannot unreasonably withhold consent for pets, but superior title covenants or head-lease restrictions on the building register may override permissions.',
      landlord: 'Landlords can require tenants to maintain adequate pet insurance covering potential property damage and must verify whether building freehold covenants prohibit domestic animals.',
      agent: 'Material Information (Part C): Agents must disclose pet restrictions or building-level covenants in portal listings before referencing fees or holding deposits are taken.'
    },
    briefAnswer: 'Under the Renters (Reform) Bill guidelines, landlords cannot unreasonably withhold consent for pets, but superior title covenants on the building register may impose building-wide restrictions.',
    callToAction: 'Search verified pet-friendly properties or check building title registers.',
    actionChips: [
      { label: 'Search pet-friendly flats in Leeds', searchQuery: 'Pet-friendly flat in Leeds' },
      { label: 'Search pet-friendly in Manchester', searchQuery: 'Pet-friendly studio in Manchester' },
      { label: 'Search pet-friendly in London', searchQuery: 'Pet-friendly 2-bed in London' }
    ]
  },

  // 2. EPC & Energy Efficiency (MEES)
  epc: {
    id: 'epc',
    isAnswerable: true,
    topic: 'Statutory EPC & MEES Regulations',
    category: 'efficiency',
    perspectives: {
      tenant: 'Rental properties in England & Wales must have an EPC rating of Band E or higher. Band E properties average £450+/year higher winter heating costs than Band C.',
      landlord: 'Letting a domestic property below Band E is unlawful unless registered on the PRS Exemptions Register (carrying civil fines up to £5,000 per breach).',
      agent: 'Material Information (Part B): A valid EPC rating must be displayed on all marketing materials within 28 days of commencement.'
    },
    briefAnswer: 'Rental homes must meet a statutory minimum EPC Band E rating. Proptii checks both the certificate rating and estimated annual heating benchmarks.',
    callToAction: 'Search high-efficiency homes (Band C+) to minimize monthly energy bills.',
    actionChips: [
      { label: 'Search energy-efficient Band C+ flats', searchQuery: 'Energy efficient flat Band C' },
      { label: 'Search modern insulated homes in Bristol', searchQuery: 'Modern 3 bed house in Bristol' }
    ]
  },

  // 3. Restrictive Covenants & Title
  covenants: {
    id: 'covenants',
    isAnswerable: true,
    topic: 'Restrictive Covenants & Title Deed Rules',
    category: 'legal',
    perspectives: {
      tenant: 'Restrictive covenants are binding conditions on the freehold title that restrict specific activities (e.g. parking commercial vans, operating a business, or exterior satellite dishes).',
      landlord: 'Landlords remain strictly liable if tenant activities breach historic covenants registered against the Land Registry Title deeds.',
      agent: 'Material Information (Part C): Restrictive covenants affecting quiet enjoyment or parking must be proactively disclosed in listing specifications.'
    },
    briefAnswer: 'A restrictive covenant is a legal obligation in property deeds limiting how the land/building can be used. Proptii cross-checks HMLR charges registers directly.',
    callToAction: 'Search any property address to review the plain-English register summary.',
    actionChips: [
      { label: 'Search properties with clear title', searchQuery: '2 bedroom flat in Leeds' },
      { label: 'Learn about title covenants in Know Your Rights', searchQuery: 'Flats near Clapham Junction' }
    ]
  },

  // 4. HMO & Sharer Licensing
  hmo: {
    id: 'hmo',
    isAnswerable: true,
    topic: 'HMO Licensing & Shared Living Rules',
    category: 'compliance',
    perspectives: {
      tenant: 'If 3 or more unrelated individuals share a property, it forms an HMO (House in Multiple Occupation). Properties with 5+ sharers require a Mandatory Council HMO License.',
      landlord: 'Operating an unlicensed HMO is a strict liability criminal offence with Rent Repayment Orders (RRO) of up to 12 months’ rent.',
      agent: 'Agents must verify whether the local council enforces Additional or Selective Licensing before letting to groups of student or professional sharers.'
    },
    briefAnswer: 'Houses in Multiple Occupation (HMOs) with 3+ sharers from multiple households require specific council safety licenses and fire escape standards.',
    callToAction: 'Explore compliant sharer houses with verified local authority licensing.',
    actionChips: [
      { label: 'Search 3+ bed shared houses in Leeds', searchQuery: '3 bed house in Leeds' },
      { label: 'Search sharer apartments in Manchester', searchQuery: '2 bed flat in Manchester' }
    ]
  },

  // 5. Tenancy Deposits & Banned Fees
  deposits: {
    id: 'deposits',
    isAnswerable: true,
    topic: 'Tenancy Deposit Caps & Fees Act 2019',
    category: 'finance',
    perspectives: {
      tenant: 'Under the Tenant Fees Act 2019, security deposits are capped at 5 weeks’ rent (for rents under £50k/year) and must be protected in a custodial/insured scheme within 30 days.',
      landlord: 'Failure to protect deposits or serve Prescribed Information within 30 days blocks Section 21 possession notices and incurs penalties of 1x to 3x the deposit sum.',
      agent: 'All agency fees (application fees, contract fees, referencing charges) are prohibited. Holding deposits are capped at 1 week’s rent.'
    },
    briefAnswer: 'Security deposits are legally capped at 5 weeks’ rent and holding deposits at 1 week’s rent. Admin and referencing fees charged to tenants are unlawful.',
    callToAction: 'Find verified rental listings with deposit protection guarantee.',
    actionChips: [
      { label: 'Search verified rental flats in Leeds', searchQuery: '2 bedroom flat in Leeds under 1200pcm' },
      { label: 'Search flats in Clapham Junction', searchQuery: '2-bed flat near Clapham Junction' }
    ]
  },

  // 6. Building Safety & Cladding (EWS1)
  building_safety: {
    id: 'building_safety',
    isAnswerable: true,
    topic: 'Building Safety & EWS1 Cladding Status',
    category: 'safety',
    perspectives: {
      tenant: 'Residential high-rise buildings (over 11m or 5 storeys) are subject to Building Safety Act regulations and mandatory safety case reports.',
      landlord: 'Qualifying leaseholders are legally protected from historical cladding remediation costs under the Building Safety Act 2022.',
      agent: 'Material Information (Part C): Agents must disclose if building safety remediation or waking watch schemes are in place.'
    },
    briefAnswer: 'The Building Safety Act 2022 protects leaseholders from cladding remediation costs. High-rise developments require external wall safety assessments (EWS1).',
    callToAction: 'Search modern residential developments with verified safety certificates.',
    actionChips: [
      { label: 'Search modern developments in London', searchQuery: 'Modern 2-bed apartment in London' },
      { label: 'Search central apartments in Manchester', searchQuery: 'Apartment in Manchester' }
    ]
  },

  // 7. Broad Search Refinement (Single Question + Location & Budget Chips)
  broad_search: {
    id: 'broad_search',
    isAnswerable: false,
    isTooBroad: true,
    clarifyingQuestion: 'Which city or budget range are you targeting?',
    category: 'broad_search',
    quickReplyChips: ['Leeds', 'Manchester', 'Bristol', 'London', 'Birmingham', 'Sheffield'],
    budgetChips: ['≤ £900/mo', '≤ £1,200/mo', '≤ £1,600/mo', '≤ £2,200/mo'],
    propertyTypeChips: ['Studio', '1-Bed Flat', '2-Bed Flat', '3-Bed House']
  }
};

# Scoring Rubric

Both scores work the same way: start at 100, deduct per finding based on severity, floor at 0. This keeps scores traceable and comparable across audits instead of being a gut-feel number.

## Deduction table (per finding, per score)

| Severity | Deduction |
|---|---|
| Critical | 30–40 |
| High | 15–20 |
| Medium | 5–10 |
| Low | 1–3 |

Use the higher end of a range when a finding is unusually broad (affects many endpoints/modules) or when multiple findings compound each other (e.g. missing auth check *and* no rate limiting on the same sensitive endpoint). Use the lower end for a narrow, contained instance.

If deductions would take a score below 0, floor it at 0 — don't report negative scores.

## Category weighting (optional refinement)

For a more structured score, weight findings by category before summing, so that a codebase's score reflects where it's actually weak rather than raw finding count. Suggested default weights — adjust if the system's nature clearly calls for it (e.g. a data pipeline with no user-facing auth should weight "auth" near zero and reweight the rest):

**Security categories:**
| Category | Weight |
|---|---|
| Input handling & injection | 25% |
| Authentication & authorization | 25% |
| Data protection | 20% |
| Dependency & supply chain | 15% |
| Infra & configuration | 10% |
| Web/API-specific | 5% |

**Performance categories:**
| Category | Weight |
|---|---|
| Data access (DB/storage) | 30% |
| Algorithmic complexity | 20% |
| Concurrency & async | 20% |
| Caching | 15% |
| Resource management | 10% |
| Scalability vs. need | 5% |

To apply: score each category 0–100 using the deduction method within that category alone, then take the weighted average for the overall Security/Performance score. This is more work and is optional — for a faster audit, a single flat deduction pass across all findings (ignoring category weights) is acceptable and should be stated as the method used in the report's "Scope & method" section.

## Calibration anchors

Use these as sanity checks against the number you land on:

- **90–100**: no Critical/High findings; only a handful of Medium/Low items. Code a careful senior engineer would sign off on with minor comments.
- **70–89**: solid overall, but at least one High finding or a cluster of Mediums in one area. Needs real but bounded work before being fully trustworthy at scale.
- **50–69**: at least one Critical, or multiple Highs. Should not go to production (security) or will hit real trouble under moderate load (performance) without remediation.
- **Below 50**: multiple Critical findings or systemic issues across most categories. Fundamental rework needed, not incremental patching.

If your deduction math lands somewhere that feels miscalibrated against these anchors (e.g. one Critical finding but the math only takes it to 85), double-check — a single Critical should almost always land the score in the 50–69 band or lower per the deduction table, and if it doesn't, the deduction chosen was probably too small for how serious the finding actually is.

## Reporting the score

Always pair the number with a one-line justification tying it to the actual findings (see main SKILL.md report structure). A bare number with no traceable reasoning isn't useful to the user and isn't verifiable.

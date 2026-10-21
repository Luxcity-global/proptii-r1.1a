import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import EarlyAccessBanner from '../../components/pricing/EarlyAccessBanner';
import PricingAudienceTabs from '../../components/pricing/PricingAudienceTabs';
import PricingBillingToggle, {
  type BillingCycle,
} from '../../components/pricing/PricingBillingToggle';
import PricingPlanGrid from '../../components/pricing/PricingPlanGrid';
import PricingCompareSection from '../../components/pricing/PricingCompareSection';
import PricingFaqSection from '../../components/pricing/PricingFaqSection';
import type { PricingAudience } from '../../utils/pricingRoutes';
import { signupUrl } from '../../utils/pricingRoutes';
import '../../styles/pricing.css';

export interface PricingPageProps {
  /** When true, page is used as a dimmed backdrop (signup modal). */
  dimmed?: boolean;
  hideShell?: boolean;
}

/**
 * S2-01 — Full /pricing page (replaces stub). All prices from plans.ts.
 */
const PricingPage: React.FC<PricingPageProps> = ({
  dimmed = false,
  hideShell = false,
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [billing, setBilling] = useState<BillingCycle>('annual');
  const [audience, setAudience] = useState<PricingAudience>('renters');

  useEffect(() => {
    const segment = searchParams.get('segment') || searchParams.get('audience');
    if (
      segment === 'renters' ||
      segment === 'landlords' ||
      segment === 'agents'
    ) {
      setAudience(segment);
    }
  }, [searchParams]);

  // Pre-select the audience tab based on the authenticated user's role.
  // Skipped when an explicit ?segment= param is present (that wins).
  // Uses user?.roles?.[0] (a primitive string) in the dep array rather than
  // user?.roles (an array ref) to ensure the effect re-runs when the role changes.
  useEffect(() => {
    if (searchParams.get('segment')) return;
    if (!user?.roleResolved) return;
    const role = user?.roles?.[0];
    if (role === 'landlord') setAudience('landlords');
    else if (role === 'agent') setAudience('agents');
    else if (role === 'tenant') setAudience('renters');
  }, [user?.roleResolved, user?.roles?.[0], searchParams]);

  const content = (
    <>
      {!hideShell && <EarlyAccessBanner />}

      <div
        className="pr-content flex-1"
        style={{
          position: 'relative',
          opacity: dimmed ? 0.35 : 1,
          pointerEvents: dimmed ? 'none' : 'auto',
          filter: dimmed ? 'blur(1px)' : 'none',
        }}
      >
        {!hideShell && <Navbar hideServiceLinks theme="light" />}
        <div style={{ paddingTop: hideShell ? 0 : '76px' }}>
          <section className="pr-hero pr-fade-in">
            <h1>
              The right plan for
              <br />
              <em>every move.</em>
            </h1>
            <p>
              Start free. Upgrade when it makes sense.
              <br />
              All paid plans include your first month free when you sign up before
              31 July 2026.
            </p>

            <PricingBillingToggle billing={billing} onChange={setBilling} />
            <PricingAudienceTabs audience={audience} onChange={setAudience} />

            {user && (
              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    const isLandlordOrAgent = user?.roles?.includes('landlord') || user?.roles?.includes('agent');
                    navigate(isLandlordOrAgent ? '/landlord' : '/dashboard');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#DC5F12',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: '3px',
                  }}
                >
                  Continue to your dashboard without a paid plan →
                </button>
              </div>
            )}
          </section>

          <section className="pr-pricing-section">
            <PricingPlanGrid audience={audience} billing={billing} />
            {audience === 'agents' && (
              <div className="pr-quota-note">
                <strong>How agent quotas work:</strong> Your monthly plan includes a
                set number of fit checks. Go over your quota and you are billed a
                simple per-check rate — £4 (Independent) or £3 (Agent Pro) — on your
                next invoice.
              </div>
            )}
          </section>

          {!dimmed && (
            <>
              <section className="pr-early-access-wrap">
                <div className="pr-early-access-box">
                  <div className="pr-ea-left">
                    <div className="pr-ea-eyebrow">
                      Early access · May to July 2026 only
                    </div>
                    <div className="pr-ea-title">
                      Your <em>first month</em>, on us.
                    </div>
                    <div className="pr-ea-desc">
                      Sign up to any paid plan before 31 July 2026 and your first
                      month is completely free. Cancel before the month ends and pay
                      nothing.
                    </div>
                  </div>
                  <div className="pr-ea-right">
                    <button
                      type="button"
                      className="pr-ea-cta"
                      onClick={() => navigate(signupUrl('renter_pro', billing))}
                    >
                      Claim your free month
                    </button>
                    <div className="pr-ea-terms">
                      Offer applies to first-time subscribers only.
                      <br />
                      Available on monthly and annual plans.
                    </div>
                  </div>
                </div>
              </section>

              <PricingCompareSection audience={audience} />
            </>
          )}
        </div>
      </div>

      {!dimmed && !hideShell && <PricingFaqSection />}
      {!dimmed && !hideShell && <Footer />}
    </>
  );

  return (
    <div className="pr-page min-h-screen flex flex-col">
      <div className="pr-bg-blobs" aria-hidden="true">
        <div className="pr-blob pr-blob-1" />
        <div className="pr-blob pr-blob-2" />
        <div className="pr-blob pr-blob-3" />
      </div>
      {content}
    </div>
  );
};

export default PricingPage;

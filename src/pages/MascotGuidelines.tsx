import React from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { SEO } from '../components/SEO';

const tabs = [
  {
    to: '/brand/mascot/overview',
    label: 'Overview',
    end: true,
    subcopy: 'Start here: who Scout is, when to use them, and how to use this guide.',
  },
  {
    to: '/brand/mascot/emotional-strategy',
    label: 'Emotional strategy',
    subcopy: 'Who Scout is, personality & voice, and how Scout flexes across product, marketing, and physical.',
  },
  {
    to: '/brand/mascot/product-2d',
    label: '2D',
    subcopy: 'Flat Scout for UI: empty states, helpers, tooltips, and onboarding. Rendering rules and pose library.',
  },
  {
    to: '/brand/mascot/marketing-3d',
    label: '3D in marketing',
    subcopy: '3D Scout for hero moments, campaigns, and social. Usage contexts, rendering rules, and poses.',
  },
  {
    to: '/brand/mascot/real-world',
    label: 'Real-world & merch',
    subcopy: 'Plush specs, statues, character suits, and convention assets. Safety and recognisability first.',
  },
  {
    to: '/brand/mascot/downloads',
    label: 'Downloads',
    subcopy: 'Approved 2D sticker pack, notebook art, and T-shirt artwork. Use only official assets.',
  },
  {
    to: '/brand/mascot/guardrails',
    label: 'Guardrails',
    subcopy: 'Do & don\'t rules and before/after examples. Keep Scout on-model and on-brand.',
  },
] as const;

type MascotSectionKey =
  | 'overview'
  | 'emotional-strategy'
  | 'product-2d'
  | 'marketing-3d'
  | 'real-world'
  | 'downloads'
  | 'guardrails';

interface SectionNavItem {
  label: string;
  anchor: string;
}

const sectionNavConfig: Record<MascotSectionKey, { label: string; items: SectionNavItem[] }> = {
  overview: {
    label: 'Overview',
    items: [
      { label: 'At a glance', anchor: 'overview-at-a-glance' },
      { label: 'Overview', anchor: 'overview-overview' },
      { label: 'When to use Scout', anchor: 'overview-when-to-use' },
    ],
  },
  'emotional-strategy': {
    label: 'Emotional strategy & layers',
    items: [
      { label: 'Who is Scout?', anchor: 'emotional-who-is-scout' },
      { label: 'Personality & voice', anchor: 'emotional-personality-voice' },
      { label: 'Product layer', anchor: 'emotional-product-layer' },
      { label: 'Marketing layer', anchor: 'emotional-marketing-layer' },
      { label: 'Physical layer', anchor: 'emotional-physical-layer' },
      { label: 'Emotion range examples', anchor: 'emotional-emotion-range' },
    ],
  },
  'product-2d': {
    label: '2D implementation',
    items: [
      { label: 'Primary usage contexts', anchor: 'product2d-primary-usage' },
      { label: 'Rendering rules (2D)', anchor: 'product2d-rendering-rules' },
      { label: 'Common scenarios (product)', anchor: 'product2d-scenarios' },
      { label: 'Pose library – product', anchor: 'product2d-pose-library' },
      { label: 'Do / Don’t', anchor: 'product2d-do-dont' },
    ],
  },
  'marketing-3d': {
    label: '3D implementation (marketing)',
    items: [
      { label: '2D vs 3D comparison', anchor: 'marketing3d-comparison' },
      { label: 'Primary usage contexts', anchor: 'marketing3d-usage-contexts' },
      { label: 'Rendering rules (3D)', anchor: 'marketing3d-rendering-rules' },
      { label: 'Common scenarios (marketing)', anchor: 'marketing3d-scenarios' },
      { label: 'Pose library – marketing', anchor: 'marketing3d-pose-library' },
      { label: 'Do / Don’t', anchor: 'marketing3d-do-dont' },
    ],
  },
  'real-world': {
    label: 'Real-world & merchandise',
    items: [
      { label: 'Plush toy specs', anchor: 'realworld-plush-specs' },
      { label: 'Convention & booth assets', anchor: 'realworld-events-spaces' },
    ],
  },
  downloads: {
    label: 'Downloads & approved assets',
    items: [
      { label: 'Scout sticker pack (2D)', anchor: 'downloads-2d-assets' },
      { label: 'Notebook & cover art', anchor: 'downloads-print-swag' },
      { label: 'T-shirt artwork', anchor: 'downloads-merch-artwork' },
    ],
  },
  guardrails: {
    label: 'Guardrails & forbidden implementations',
    items: [
      { label: 'Do & Don’t', anchor: 'guardrails-do-dont' },
      { label: 'Before / after examples', anchor: 'guardrails-before-after' },
    ],
  },
};

const MascotGuidelines: React.FC = () => {
  const location = useLocation();
  const isGridView = location.pathname === '/brand/mascot';
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentSectionKey =
    (pathParts[2] as MascotSectionKey | undefined) ?? 'overview';
  const currentSectionNav =
    sectionNavConfig[currentSectionKey] ?? sectionNavConfig.overview;

  return (
    <>
      <SEO
        title="Scout Mascot Brand Guidelines | Proptii"
        description="Central source of truth for Scout mascot usage across product UI, marketing, and real-world experiences. Learn how to use Scout in 2D, 3D, and physical formats."
        canonical="/brand/mascot"
        keywords={[
          'mascot guidelines',
          'brand mascot',
          'design system',
          'Scout mascot',
          'Proptii brand',
        ]}
        category="Brand Guidelines"
      />

      <div className="min-h-screen font-nunito bg-white">
        <header className="absolute top-0 left-0 right-0 z-20">
          <div className="max-w-7xl mx-auto px-4 h-20 flex items-center">
            <Link to="/">
              <img
                src="/images/proptii-logo.png"
                alt="Proptii"
                className="h-12 w-auto"
              />
            </Link>
          </div>
        </header>

        <main className="pt-24 pb-16">
          <section className="relative h-[40vh] md:h-[50vh] flex items-center overflow-hidden bg-gradient-to-br from-[#FDF5EC]/60 via-white/60 to-[#E3F3FF]/60">
            <div className="absolute inset-0 pointer-events-none">
              <img
                src="/images/sctbg.png"
                alt="Scout background"
                className="w-full h-full object-contain opacity-40 object-right"
              />
              <div className="absolute -top-24 -right-16 w-64 h-64 bg-[#E65D24]/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 -left-8 w-72 h-72 bg-[#136C9E]/10 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr),minmax(0,1fr)] gap-10 items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#136C9E] mb-3">
                  Brand system
                </p>
                <h1 className="text-3xl md:text-5xl font-bold font-archivo text-[#0F2537] mb-4">
                  Scout Mascot Guidelines
                </h1>
                <p className="text-base md:text-lg text-[#374957] mb-6 max-w-xl">
                  Your source of truth for using Scout consistently across product UI, marketing, and real-world
                  experiences. If you&apos;re about to put Scout anywhere, start here.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[#0F2537] text-white text-xs font-semibold px-4 py-1.5">
                    Design · Product · Marketing
                  </span>
                </div>
              </div>

              <div className="hidden md:flex justify-end" />
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 mt-10 md:mt-14">
            {isGridView ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tabs.map((tab, index) => {
                  const pastelClasses = [
                    'from-[#FDE1D4] to-[#F8C1A8]',
                    'from-[#E3F3FF] to-[#C4E4FF]',
                    'from-[#E7F8EC] to-[#C3E9D4]',
                    'from-[#F5E8FF] to-[#E2C9FF]',
                    'from-[#FFF3D9] to-[#FFE1AC]',
                    'from-[#E6F4FF] to-[#D0E7FF]',
                    'from-[#FFE6EB] to-[#FFC9D7]',
                  ];
                  const gradient = pastelClasses[index % pastelClasses.length];
                  return (
                    <Link
                      key={tab.to}
                      to={tab.to}
                      className={`relative flex flex-col justify-between rounded-3xl px-6 py-6 text-left shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 bg-gradient-to-br ${gradient}`}
                      style={{ fontFamily: 'Archivo, sans-serif' }}
                    >
                      <div className="mb-4">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/80 text-[#0F2537] text-base font-bold">
                          {tab.label.charAt(0)}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-xl font-bold text-[#0F2537] capitalize">
                          {tab.label}
                        </h3>
                        <p className="text-sm text-[#374957]/90 max-w-xs">
                          {tab.subcopy}
                        </p>
                      </div>
                      <span className="mt-4 inline-flex items-center text-sm font-semibold text-[#0F2537]">
                        View guide
                        <span className="ml-1">↗</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-[260px,minmax(0,1fr)] gap-10">
                <aside className="md:sticky md:top-24 md:self-start">
                  <button
                    type="button"
                    className="mb-4 inline-flex items-center justify-center px-4 py-2 rounded-full text-xs md:text-sm font-semibold border border-[#136C9E] text-[#136C9E] bg-white hover:bg-[#136C9E]/5 transition-colors"
                    style={{ fontFamily: 'Archivo, sans-serif' }}
                    onClick={() => (window.location.href = '/brand/mascot')}
                  >
                    Back
                  </button>
                  <div className="mb-4 text-xs font-semibold text-gray-500 uppercase tracking-[0.18em]">
                    {currentSectionNav.label}
                  </div>
                  <nav className="flex md:flex-col flex-row flex-wrap gap-2 md:gap-1 text-sm">
                    {currentSectionNav.items.map((item) => (
                      <a
                        key={item.anchor}
                        href={`#${item.anchor}`}
                        className="px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-colors bg-gray-50 text-[#374957] hover:bg-gray-100 border border-transparent text-left"
                        style={{ fontFamily: 'Archivo, sans-serif' }}
                      >
                        {item.label}
                      </a>
                    ))}
                  </nav>
                </aside>

                <div className="mt-2 md:mt-0">
                  <Outlet />
                </div>
              </div>
            )}
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MascotGuidelines;


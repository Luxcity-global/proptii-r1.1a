import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { SEO } from '../components/SEO';

const tabs = [
  { to: '/brand/mascot', label: 'Overview', end: true },
  { to: '/brand/mascot/emotional-strategy', label: 'Emotional strategy' },
  { to: '/brand/mascot/product-2d', label: '2D in product' },
  { to: '/brand/mascot/marketing-3d', label: '3D in marketing' },
  { to: '/brand/mascot/real-world', label: 'Real-world & merch' },
  { to: '/brand/mascot/downloads', label: 'Downloads' },
  { to: '/brand/mascot/guardrails', label: 'Guardrails' },
] as const;

const MascotGuidelines: React.FC = () => {
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
        <Navbar />

        <main className="pt-24 pb-16">
          <section className="relative h-[40vh] md:h-[50vh] flex items-center overflow-hidden bg-gradient-to-br from-[#FDF5EC] via-white to-[#E3F3FF]">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 -right-16 w-64 h-64 bg-[#E65D24]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 -left-8 w-72 h-72 bg-[#136C9E]/5 rounded-full blur-3xl" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#136C9E] mb-3">
                  Brand system
                </p>
                <h1 className="text-3xl md:text-5xl font-bold font-archivo text-[#0F2537] mb-4">
                  Scout Mascot Guidelines
                </h1>
                <p className="text-base md:text-lg text-[#374957] mb-6 max-w-xl">
                  A mini design system for Scout – the central source of truth for how our mascot shows up in product,
                  marketing, and the real world.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-[#0F2537] text-white text-xs font-semibold px-4 py-1.5">
                    Design · Product · Marketing
                  </span>
                </div>
              </div>

              <div className="hidden md:flex justify-end">
                <div className="relative w-80 h-64 rounded-3xl bg-white shadow-xl border border-[#E3EDF7] overflow-hidden flex items-center justify-center">
                  <div className="absolute inset-x-6 top-6 flex justify-between text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                    <span>Product</span>
                    <span>Marketing</span>
                    <span>Physical</span>
                  </div>
                  <div className="mt-6 flex h-full w-full items-end justify-center pb-6">
                    <div className="flex gap-3 w-full px-6">
                      <div className="flex-1 h-24 rounded-2xl bg-gradient-to-t from-[#136C9E] to-[#A3D9FF] opacity-90" />
                      <div className="flex-1 h-32 rounded-2xl bg-gradient-to-t from-[#E65D24] to-[#FFD3B2] opacity-95" />
                      <div className="flex-1 h-20 rounded-2xl bg-gradient-to-t from-[#F2C94C] to-[#FFE9A3] opacity-90" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="max-w-7xl mx-auto px-4 mt-10 md:mt-14">
            <div className="grid grid-cols-1 md:grid-cols-[260px,minmax(0,1fr)] gap-10">
              <aside className="md:sticky md:top-24 md:self-start">
                <div className="mb-4 text-xs font-semibold text-gray-500 uppercase tracking-[0.18em]">
                  Mascot system
                </div>
                <nav className="flex md:flex-col flex-row flex-wrap gap-2 md:gap-1 text-sm">
                  {tabs.map((tab) => (
                    <NavLink
                      key={tab.to}
                      to={tab.to}
                      end={tab.end}
                      className={({ isActive }) =>
                        `px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-colors ${
                          isActive
                            ? 'bg-[#E65D24]/10 text-[#E65D24] border border-[#E65D24]'
                            : 'bg-gray-50 text-[#374957] hover:bg-gray-100 border border-transparent'
                        }`
                      }
                    >
                      {tab.label}
                    </NavLink>
                  ))}
                </nav>
              </aside>

              <div className="mt-2 md:mt-0">
                <Outlet />
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default MascotGuidelines;


import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Pricing: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-nunito bg-[#f9f5f0]">
      <Navbar />

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 py-16 md:py-24">
          <h1 className="text-3xl md:text-5xl font-bold text-[#0F2537] mb-6">
            Simple, transparent pricing.
          </h1>

          <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
            Everyone starts with <span className="font-semibold">3 months free</span> — no credit card, no commitment.
            Tenants and buyers: core search is free forever. Landlords and agents: full access during your trial,
            then choose a plan that fits your portfolio. We’ll always notify you before any charges.
          </p>

          <div className="grid gap-6 md:gap-8 md:grid-cols-2 mb-10">
            <div className="bg-white rounded-3xl shadow-md p-6 md:p-8">
              <h2 className="text-2xl font-bold text-[#0F2537] mb-3">
                Join as a Tenant / Buyer
              </h2>
              <p className="text-gray-700 mb-6">
                Search across major UK property sites in plain English. Save properties, book viewings,
                and manage your journey in one place. Core search is free forever.
              </p>
              <a
                href="/register?role=tenant"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-[#E65D24] text-white font-semibold hover:bg-opacity-90 transition-colors"
              >
                Join as Tenant / Buyer
              </a>
            </div>

            <div className="bg-white rounded-3xl shadow-md p-6 md:p-8">
              <h2 className="text-2xl font-bold text-[#0F2537] mb-3">
                Join as a Landlord / Agent
              </h2>
              <p className="text-gray-700 mb-6">
                Manage viewings, referencing, and contracts from a single dashboard. Get pre‑verified tenants
                and reduce admin across your portfolio — free for your first 3 months.
              </p>
              <a
                href="/register?role=agent"
                className="inline-flex items-center justify-center px-6 py-3 rounded-full border border-[#E65D24] text-[#E65D24] font-semibold hover:bg-[#E65D24] hover:text-white transition-colors"
              >
                Join as Landlord / Agent
              </a>
            </div>
          </div>

          <p className="text-sm md:text-base text-gray-600">
            After your trial, plans start from <span className="font-semibold">[price TBD]/month</span>. We’ll email you
            before your trial ends so you can upgrade, downgrade, or cancel — no surprises.
          </p>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Pricing;


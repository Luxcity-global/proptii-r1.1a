import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const KnowYourRights: React.FC = () => {
  return (
    <div className="min-h-screen font-nunito">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16">
        <Link
          to="/tools"
          className="inline-flex items-center gap-2 text-[#E65D24] hover:underline mb-8"
          style={{ fontFamily: 'Archivo, sans-serif' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to Tools
        </Link>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
            Know Your Rights
          </h1>
        </div>
        <p className="text-lg text-gray-600 mb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Interactive guide to core UK tenant rights and responsibilities. Expand each section to learn more.
        </p>

        <RightsAccordion />
      </main>
      <Footer />
    </div>
  );
};

interface RightItem {
  id: string;
  title: string;
  body: string;
}

const RIGHTS: RightItem[] = [
  {
    id: 'safety',
    title: 'Safe, well‑maintained home',
    body: 'Landlords must make sure the property is safe and free from serious hazards, keep gas and electrical systems safe, and carry out most repairs to the structure and exterior of the property.',
  },
  {
    id: 'deposit',
    title: 'Protected tenancy deposit',
    body: 'If you pay a tenancy deposit in England or Wales, it must be protected in a government‑approved scheme and you should receive prescribed information about where it is held.',
  },
  {
    id: 'notice',
    title: 'Fair notice before eviction',
    body: 'Landlords must follow a legal process to end most tenancies, including giving the correct amount of written notice and, in many cases, obtaining a court order.',
  },
  {
    id: 'information',
    title: 'Key documents and information',
    body: 'You should receive the latest How to Rent guide, a gas safety certificate (if applicable), an energy performance certificate (EPC) and details of the deposit scheme.',
  },
  {
    id: 'responsibilities',
    title: 'Your responsibilities as a tenant',
    body: 'You must pay rent on time, look after the property, report repairs promptly, and respect the terms of your tenancy agreement and your neighbours.',
  },
];

const RightsAccordion: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>(RIGHTS[0]?.id ?? null);

  return (
    <section className="bg-gray-50 rounded-2xl p-6 md:p-8 space-y-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
      {RIGHTS.map((item) => {
        const isOpen = openId === item.id;
        return (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : item.id)}
              className="w-full flex items-center justify-between px-4 py-3 md:px-5 md:py-4 text-left"
            >
              <span className="font-semibold text-gray-900 text-sm md:text-base">{item.title}</span>
              <span className="ml-4 text-xl leading-none text-gray-500">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 md:px-5 md:pb-5 text-sm text-gray-700 border-t border-gray-100">
                <p className="pt-2">{item.body}</p>
                <p className="mt-3 text-xs text-gray-500">
                  This is a simplified summary. Always check official government guidance or seek independent advice for
                  your specific situation.
                </p>
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default KnowYourRights;

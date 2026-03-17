import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const ReadinessChecker: React.FC = () => {
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
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center">
            <ClipboardCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
            Rental Readiness Checker
          </h1>
        </div>
        <p className="text-lg text-gray-600 mb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Assess your readiness for rental applications with our interactive checklist. Tick off items as you prepare – your answers stay on this page only.
        </p>

        <ReadinessChecklist />
      </main>
      <Footer />
    </div>
  );
};

interface ChecklistItem {
  id: string;
  label: string;
  section: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  { id: 'id', label: 'Photo ID (passport or driving licence)', section: 'Documents' },
  { id: 'proof-address', label: 'Recent proof of address (utility bill or bank statement)', section: 'Documents' },
  { id: 'income', label: 'Proof of income (3 months payslips or accountant letter)', section: 'Documents' },
  { id: 'references', label: 'Previous landlord or agent reference details', section: 'Documents' },
  { id: 'credit', label: 'You are prepared for a soft credit check if required', section: 'Checks' },
  { id: 'right-to-rent', label: 'Right to Rent documents for everyone over 18', section: 'Checks' },
  { id: 'deposit', label: 'You have funds ready for holding deposit and first rent', section: 'Finances' },
  { id: 'guarantor', label: 'You know who could act as a guarantor if needed', section: 'Finances' },
  { id: 'timescale', label: 'You know your ideal move‑in date and can be flexible', section: 'Planning' },
  { id: 'questions', label: 'You have a short list of questions to ask at viewings', section: 'Planning' },
];

const ReadinessChecklist: React.FC = () => {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const total = CHECKLIST_ITEMS.length;
  const doneCount = CHECKLIST_ITEMS.filter((item) => completed[item.id]).length;
  const percent = Math.round((doneCount / total) * 100);

  const sections = Array.from(new Set(CHECKLIST_ITEMS.map((i) => i.section)));

  return (
    <section className="bg-gray-50 rounded-2xl p-6 md:p-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1">Your readiness score</h2>
          <p className="text-sm text-gray-600">
            {doneCount} of {total} items completed ({percent}%)
          </p>
        </div>
        <div className="w-full md:w-64">
          <div className="h-3 bg-white rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#E65D24] to-[#F59E0B] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section} className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{section}</h3>
            <ul className="space-y-2.5">
              {CHECKLIST_ITEMS.filter((i) => i.section === section).map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center transition-colors ${
                      completed[item.id]
                        ? 'bg-[#E65D24] border-[#E65D24] text-white'
                        : 'border-gray-300 bg-white text-transparent'
                    }`}
                    aria-pressed={!!completed[item.id]}
                  >
                    <span className="text-xs">✓</span>
                  </button>
                  <span className={completed[item.id] ? 'text-gray-500 line-through' : 'text-gray-800'}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-gray-500">
        This checklist is for guidance only and does not constitute legal advice. Landlords and agents may ask for
        additional information depending on their policies.
      </p>
    </section>
  );
};

export default ReadinessChecker;

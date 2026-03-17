import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Route } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const ProcessSimulator: React.FC = () => {
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
          <div className="w-16 h-16 rounded-2xl bg-yellow-100 flex items-center justify-center">
            <Route className="w-8 h-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
            Process Simulator
          </h1>
        </div>
        <p className="text-lg text-gray-600 mb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Walk through the rental application process step by step. Move through each stage to see what typically happens.
        </p>

        <ProcessSteps />
      </main>
      <Footer />
    </div>
  );
};

const STEPS = [
  {
    id: 1,
    title: '1. Viewing & offer',
    detail: 'You view the property, ask questions and submit an offer with your preferred move‑in date.',
  },
  {
    id: 2,
    title: '2. Application & referencing',
    detail:
      'The agent collects your details, references and documents. Referencing companies verify income, credit history and previous landlords.',
  },
  {
    id: 3,
    title: '3. Contract & checks',
    detail:
      'You receive a draft tenancy agreement, review key clauses and sign. Right to Rent and any outstanding checks are completed.',
  },
  {
    id: 4,
    title: '4. Payment & deposit protection',
    detail:
      'You pay the first rent and deposit. The deposit is protected in an approved scheme and you receive confirmation.',
  },
  {
    id: 5,
    title: '5. Move‑in day',
    detail:
      'You collect keys, complete an inventory and meter readings, and receive safety certificates plus the How to Rent guide.',
  },
];

const ProcessSteps: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = STEPS[currentIndex];

  return (
    <section className="bg-gray-50 rounded-2xl p-6 md:p-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
      <div className="flex flex-col md:flex-row gap-6">
        <ol className="md:w-1/3 space-y-3">
          {STEPS.map((step, index) => (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  index === currentIndex
                    ? 'bg-[#E65D24] text-white'
                    : 'bg-white text-gray-800 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {step.title}
              </button>
            </li>
          ))}
        </ol>

        <div className="md:flex-1 bg-white rounded-xl border border-gray-200 p-5 md:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">{current.title}</h3>
            <p className="text-sm text-gray-700 mb-4">{current.detail}</p>
            <p className="text-xs text-gray-500">
              Tip: timelines vary between properties and agents. Use this as a guide and always confirm dates in writing.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className={`px-3 py-2 rounded-lg text-sm font-medium border ${
                currentIndex === 0
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            <p className="text-xs text-gray-500">
              Step {currentIndex + 1} of {STEPS.length}
            </p>
            <button
              type="button"
              disabled={currentIndex === STEPS.length - 1}
              onClick={() => setCurrentIndex((i) => Math.min(STEPS.length - 1, i + 1))}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${
                currentIndex === STEPS.length - 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#E65D24] text-white hover:bg-[#d4501f]'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSimulator;

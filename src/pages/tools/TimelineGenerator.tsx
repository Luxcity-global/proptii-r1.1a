import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const TimelineGenerator: React.FC = () => {
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
          <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center">
            <Clock className="w-8 h-8 text-teal-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
            Timeline Generator
          </h1>
        </div>
        <p className="text-lg text-gray-600 mb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Estimate how long your rental application process might take based on a few quick questions.
        </p>

        <TimelineForm />
      </main>
      <Footer />
    </div>
  );
};

const TimelineForm: React.FC = () => {
  const [properties, setProperties] = useState('1');
  const [hasGuarantor, setHasGuarantor] = useState<'yes' | 'no'>('no');
  const [employmentType, setEmploymentType] = useState<'permanent' | 'contract' | 'student'>('permanent');

  const baseDays = 7; // viewing to offer accepted
  let referencingDays = employmentType === 'permanent' ? 5 : employmentType === 'contract' ? 7 : 8;
  if (hasGuarantor === 'yes') referencingDays += 3;
  const extraProperties = Math.max(0, Number(properties) - 1);
  const searchDays = extraProperties * 3;
  const totalDays = baseDays + referencingDays + searchDays + 3; // contract + move‑in prep
  const weeks = (totalDays / 7).toFixed(1);

  return (
    <section className="bg-gray-50 rounded-2xl p-6 md:p-8 space-y-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">How many properties are you applying for?</label>
          <input
            type="number"
            min={1}
            max={10}
            value={properties}
            onChange={(e) => setProperties(e.target.value || '1')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65D24]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Will you need a guarantor?</label>
          <select
            value={hasGuarantor}
            onChange={(e) => setHasGuarantor(e.target.value as 'yes' | 'no')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65D24]"
          >
            <option value="no">No</option>
            <option value="yes">Yes / likely</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Main employment situation</label>
          <select
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value as typeof employmentType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65D24]"
          >
            <option value="permanent">Permanent employment</option>
            <option value="contract">Contract / self‑employed</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Estimated total timeline</h3>
          <p className="text-3xl font-bold text-[#E65D24] mb-2">{weeks} weeks</p>
          <p className="text-sm text-gray-700">
            From first viewing to move‑in day, assuming the property is taken off the market quickly and documents are
            provided promptly.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 text-sm text-gray-700 space-y-2">
          <p>
            <strong>Breakdown (approximate):</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Searching & offers: ~{baseDays + searchDays} days</li>
            <li>Referencing checks: ~{referencingDays} days</li>
            <li>Contracts & move‑in prep: ~3 days</li>
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            These estimates are based on typical UK rental timelines and are not guaranteed. Always confirm specific
            dates with your landlord or agent.
          </p>
        </div>
      </div>
    </section>
  );
};

export default TimelineGenerator;

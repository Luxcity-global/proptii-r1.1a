import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Files } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const DocumentTracker: React.FC = () => {
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
          <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center">
            <Files className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
            Document Tracker
          </h1>
        </div>
        <p className="text-lg text-gray-600 mb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Track which rental documents you have and what you still need. Use the table below to stay organised.
        </p>

        <DocumentTrackerTable />
      </main>
      <Footer />
    </div>
  );
};

interface TrackedDocument {
  id: string;
  name: string;
  requiredFor: string;
}

const BASE_DOCUMENTS: TrackedDocument[] = [
  { id: 'how-to-rent', name: 'How to Rent guide (provided by landlord/agent)', requiredFor: 'England assured shorthold tenancies' },
  { id: 'epc', name: 'Energy Performance Certificate (EPC)', requiredFor: 'Most rental properties' },
  { id: 'gas-safety', name: 'Gas safety certificate', requiredFor: 'Properties with gas appliances' },
  { id: 'deposit-scheme', name: 'Deposit protection information', requiredFor: 'Tenancies with a deposit' },
  { id: 'right-to-rent', name: 'Right to Rent documents copied and checked', requiredFor: 'All adults living in the property' },
];

type DocStatus = 'have' | 'need' | 'not-applicable';

const STATUS_LABELS: Record<DocStatus, string> = {
  have: 'Have it',
  need: 'Need it',
  'not-applicable': 'Not needed',
};

const DocumentTrackerTable: React.FC = () => {
  const [status, setStatus] = useState<Record<string, DocStatus>>({});

  const handleChange = (id: string, value: DocStatus) => {
    setStatus((prev) => ({ ...prev, [id]: value }));
  };

  const haveCount = Object.values(status).filter((v) => v === 'have').length;
  const needCount = Object.values(status).filter((v) => v === 'need').length;

  return (
    <section className="bg-gray-50 rounded-2xl p-6 md:p-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Track your compliance documents</h2>
        <p className="text-sm text-gray-600">
          {haveCount} ready · {needCount} to organise
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 pr-4 font-semibold text-gray-700">Document</th>
              <th className="text-left py-3 pr-4 font-semibold text-gray-700">Required for</th>
              <th className="text-left py-3 font-semibold text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {BASE_DOCUMENTS.map((doc) => (
              <tr key={doc.id} className="align-top">
                <td className="py-3 pr-4 text-gray-900">{doc.name}</td>
                <td className="py-3 pr-4 text-gray-600 max-w-xs">{doc.requiredFor}</td>
                <td className="py-3">
                  <select
                    value={status[doc.id] ?? 'need'}
                    onChange={(e) => handleChange(doc.id, e.target.value as DocStatus)}
                    className="border border-gray-300 rounded-full px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#E65D24]"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        This tracker is for your own organisation only. Always refer to official government guidance and your tenancy
        agreement for the full list of documents required.
      </p>
    </section>
  );
};

export default DocumentTracker;

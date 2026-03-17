import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

const ViewingTracker: React.FC = () => {
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
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center">
            <Calendar className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
            Viewing Tracker
          </h1>
        </div>
        <p className="text-lg text-gray-600 mb-8" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Organize and track your property viewings and agent communications. Use the log below to keep everything in one place.
        </p>

        <ViewingTrackerContent />
      </main>
      <Footer />
    </div>
  );
};

interface Viewing {
  id: number;
  property: string;
  date: string;
  agent: string;
  status: 'planned' | 'completed' | 'cancelled';
}

const ViewingTrackerContent: React.FC = () => {
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [form, setForm] = useState<Omit<Viewing, 'id' | 'status'>>({
    property: '',
    date: '',
    agent: '',
  } as any);
  const [status, setStatus] = useState<Viewing['status']>('planned');

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const addViewing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.property || !form.date) return;
    setViewings((prev) => [
      ...prev,
      {
        id: Date.now(),
        property: form.property,
        date: form.date,
        agent: form.agent,
        status,
      },
    ]);
    setForm({ property: '', date: '', agent: '' } as any);
    setStatus('planned');
  };

  return (
    <section className="bg-gray-50 rounded-2xl p-6 md:p-8 space-y-6" style={{ fontFamily: 'Archivo, sans-serif' }}>
      <form onSubmit={addViewing} className="grid md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Property / area</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65D24]"
            value={form.property}
            onChange={(e) => handleChange('property', e.target.value)}
            placeholder="e.g. 2 bed in Leeds"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date & time</label>
          <input
            type="datetime-local"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65D24]"
            value={form.date}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent / contact</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65D24]"
            value={form.agent}
            onChange={(e) => handleChange('agent', e.target.value)}
            placeholder="Agent name or email"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-[#E65D24]"
            value={status}
            onChange={(e) => setStatus(e.target.value as Viewing['status'])}
          >
            <option value="planned">Planned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#E65D24] text-white text-sm font-medium whitespace-nowrap"
          >
            Add
          </button>
        </div>
      </form>

      {viewings.length === 0 ? (
        <p className="text-sm text-gray-500">No viewings added yet. Start by logging your next appointment.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 pr-4 font-semibold text-gray-700">Property</th>
                <th className="text-left py-3 pr-4 font-semibold text-gray-700">Date</th>
                <th className="text-left py-3 pr-4 font-semibold text-gray-700">Agent / contact</th>
                <th className="text-left py-3 font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {viewings.map((v) => (
                <tr key={v.id}>
                  <td className="py-3 pr-4 text-gray-900">{v.property}</td>
                  <td className="py-3 pr-4 text-gray-700">{v.date && new Date(v.date).toLocaleString()}</td>
                  <td className="py-3 pr-4 text-gray-700">{v.agent || '—'}</td>
                  <td className="py-3">
                    <span
                      className={
                        v.status === 'completed'
                          ? 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700'
                          : v.status === 'cancelled'
                            ? 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700'
                            : 'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700'
                      }
                    >
                      {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ViewingTracker;

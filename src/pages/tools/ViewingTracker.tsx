import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Calendar, MapPin, User, FileText, Trash2 } from 'lucide-react';
import Footer from '../../components/Footer';
import { SEO } from '../../components/SEO';

interface Viewing {
  id: string;
  propertyAddress: string;
  date: string;
  time: string;
  agentName: string;
  agentContact: string;
  notes: string;
}

const ViewingTracker: React.FC = () => {
  const [viewings, setViewings] = useState<Viewing[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<Omit<Viewing, 'id'>>({
    propertyAddress: '',
    date: '',
    time: '',
    agentName: '',
    agentContact: '',
    notes: '',
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('viewings');
    if (saved) {
      try {
        setViewings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load viewings:', e);
      }
    }
  }, []);

  // Save to localStorage when viewings change
  useEffect(() => {
    if (viewings.length > 0) {
      localStorage.setItem('viewings', JSON.stringify(viewings));
    }
  }, [viewings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newViewing: Viewing = {
      ...formData,
      id: Date.now().toString(),
    };
    setViewings([...viewings, newViewing]);
    setFormData({
      propertyAddress: '',
      date: '',
      time: '',
      agentName: '',
      agentContact: '',
      notes: '',
    });
    setIsFormOpen(false);
  };

  const handleDelete = (id: string) => {
    setViewings(viewings.filter((v) => v.id !== id));
  };

  return (
    <>
      <SEO
        title="Free Property Viewing Tracker | Organize Rental Viewings | Proptii"
        description="Free property viewing tracker for UK tenants. Organize and track all property viewings, agent contacts, viewing dates, and notes. Save your data locally in your browser. Perfect for managing multiple property viewings during your rental search."
        canonical="/tools/viewing-tracker"
        keywords={[
          'property viewing tracker',
          'rental viewing organizer',
          'UK property viewings',
          'viewing tracker tool',
          'property viewing notes',
          'rental property organizer',
          'viewing management',
          'property search tracker',
          'viewing schedule tracker',
          'rental viewing log'
        ]}
        relatedTerms={[
          'property viewings UK',
          'rental property search',
          'viewing properties',
          'property hunting',
          'UK rental search'
        ]}
        category="Rental Tools"
      />
      
      <div className="min-h-screen font-nunito bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 pt-12 pb-12">
          <Link
            to="/tools"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tools
          </Link>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Archivo, sans-serif' }}>Viewing Tracker</h1>
                <p className="text-gray-600" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
                  Organize and track your property viewings and agent communications.
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(!isFormOpen)}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Add Viewing
              </button>
            </div>

            {/* SEO Content Section */}
            <div className="bg-green-50 rounded-xl p-6 mb-8 border border-green-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
                Why Track Your Property Viewings?
              </h2>
              <div style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }} contentEditable={false}>
                <p className="mb-4">
                  When searching for a rental property in the UK, you'll likely view multiple properties with different agents. Keeping track of viewing details, agent contacts, and your impressions helps you make informed decisions and stay organized throughout your search.
                </p>
                <p className="mb-4">
                  Our viewing tracker lets you record: <strong>Property address</strong>, <strong>Viewing date and time</strong>, <strong>Agent name and contact information</strong>, and <strong>Personal notes</strong> about the property, neighborhood, or any concerns. All data is saved locally in your browser for privacy.
                </p>
                <p>
                  <strong>Pro tip:</strong> Take photos during viewings (with permission) and note any issues, questions, or positive features. This helps you compare properties later and remember important details when making your decision.
                </p>
              </div>
            </div>

            {isFormOpen && (
              <form onSubmit={handleSubmit} className="mb-8 border border-gray-200 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Property Address
                    </label>
                    <input
                      type="text"
                      value={formData.propertyAddress}
                      onChange={(e) => setFormData({ ...formData, propertyAddress: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agent Name</label>
                    <input
                      type="text"
                      value={formData.agentName}
                      onChange={(e) => setFormData({ ...formData, agentName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Agent Contact</label>
                    <input
                      type="text"
                      value={formData.agentContact}
                      onChange={(e) => setFormData({ ...formData, agentContact: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Save Viewing
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {viewings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No viewings tracked yet. Add your first viewing to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {viewings.map((viewing) => (
                  <div
                    key={viewing.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center">
                          <MapPin className="h-5 w-5 mr-2 text-indigo-600" />
                          {viewing.propertyAddress}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2" />
                            {viewing.date} at {viewing.time}
                          </div>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {viewing.agentName}
                          </div>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2" />
                            {viewing.agentContact}
                          </div>
                        </div>
                        {viewing.notes && (
                          <p className="mt-4 text-gray-700 bg-gray-50 rounded p-3">{viewing.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(viewing.id)}
                        className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default ViewingTracker;
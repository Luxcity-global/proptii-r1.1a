import React from 'react';
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
          Organize and track your property viewings and agent communications. Never miss a viewing or lose track of a property.
        </p>
        <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-500" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Viewing tracker coming soon.
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ViewingTracker;

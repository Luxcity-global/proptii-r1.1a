import React from 'react';
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
          Estimate how long your rental application process will take. Get accurate timeline estimates based on your situation.
        </p>
        <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-500" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Timeline generator coming soon.
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TimelineGenerator;

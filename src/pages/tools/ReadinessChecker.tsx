import React from 'react';
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
          Assess your readiness for rental applications with our interactive checklist. Check off items as you prepare for your rental application.
        </p>
        <div className="bg-gray-50 rounded-2xl p-8 text-center text-gray-500" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Interactive checklist coming soon.
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ReadinessChecker;

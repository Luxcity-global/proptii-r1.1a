import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import Footer from '../../components/Footer';
import { SEO } from '../../components/SEO';

interface DocumentItem {
  id: string;
  name: string;
  category: string;
}

const documents: DocumentItem[] = [
  { id: 'passport', name: 'UK Passport or Right to Rent Document', category: 'Identity' },
  { id: 'payslips', name: 'Payslips (last 3 months)', category: 'Income' },
  { id: 'bank-statements', name: 'Bank Statements (last 3 months)', category: 'Income' },
  { id: 'employment-contract', name: 'Employment Contract', category: 'Income' },
  { id: 'previous-landlord', name: 'Previous Landlord Reference', category: 'Rental History' },
  { id: 'employer-reference', name: 'Employer Reference', category: 'References' },
  { id: 'credit-check', name: 'Credit Check Report', category: 'Financial' },
  { id: 'proof-of-address', name: 'Proof of Address (Utility Bill)', category: 'Identity' },
  { id: 'guarantor', name: 'Guarantor Details (if required)', category: 'Guarantor' },
  { id: 'deposit-proof', name: 'Deposit Funds Proof', category: 'Financial' },
];

const categories = ['Identity', 'Income', 'Rental History', 'References', 'Financial', 'Guarantor'];

const DocumentTracker: React.FC = () => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]);

  const toggleCheck = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const totalItems = documents.length;
  const checkedCount = Object.values(checked).filter(Boolean).length;
  const percentage = totalItems > 0 ? (checkedCount / totalItems) * 100 : 0;

  const getCategoryDocuments = (category: string) => {
    return documents.filter((doc) => doc.category === category);
  };

  return (
    <>
      <SEO
        title="Free Rental Document Tracker | UK Tenant Application Documents | Proptii"
        description="Free interactive document tracker for UK rental applications. Track which documents you have and what you still need. Organize by category: Identity, Income, References, Financial, and Guarantor documents. Visual progress tracking included."
        canonical="/tools/document-tracker"
        keywords={[
          'rental document tracker',
          'tenant document checklist',
          'UK rental documents',
          'rental application documents',
          'tenant document organizer',
          'property rental documents',
          'rental document list',
          'UK tenant paperwork',
          'rental application checklist',
          'document preparation rental'
        ]}
        relatedTerms={[
          'rental documents UK',
          'tenant application',
          'rental paperwork',
          'property rental documents',
          'UK housing documents'
        ]}
        category="Rental Tools"
      />
      
      <div 
        className="min-h-screen font-nunito"
        style={{ 
          backgroundImage: 'url(/assets/add_prp_slide/addtenbg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          width: '100%'
        }}
      >
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-16">
          <Link
            to="/tools"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
            style={{ fontFamily: 'Archivo, sans-serif' }}
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tools
          </Link>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10 mb-10">
            <h1 
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 text-center" 
              style={{ fontFamily: 'Archivo, sans-serif' }}
            >
              Document Tracker
            </h1>
            <p 
              className="text-gray-600 mb-8 text-center max-w-2xl mx-auto" 
              style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}
            >
              Track which rental documents you have and what you still need for your application.
            </p>

            {/* Progress Section */}
            <div className="mb-8 bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900" style={{ fontFamily: 'Archivo, sans-serif' }}>Progress</h3>
                <span className="text-2xl font-bold text-indigo-600" style={{ fontFamily: 'Archivo, sans-serif' }}>{Math.round(percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2" style={{ fontFamily: 'Archivo, sans-serif' }}>
                {checkedCount} of {totalItems} documents collected
              </p>
            </div>

            {/* Main document tracker layout */}
            <div className="bg-[#F7F8FB] rounded-3xl p-6 md:p-10">
              <div className="grid md:grid-cols-[280px,minmax(0,1fr)] gap-10 items-stretch">
                {/* Left sidebar - categories */}
                <div>
                  <div className="bg-white rounded-2xl shadow-md p-4 space-y-2">
                    {categories.map((category, index) => {
                      const categoryDocs = getCategoryDocuments(category);
                      const categoryChecked = categoryDocs.filter((doc) => checked[doc.id]).length;
                      const isComplete = categoryDocs.length > 0 && categoryChecked === categoryDocs.length;
                      const isCurrentCategory = selectedCategory === category;

                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                            isCurrentCategory
                              ? 'bg-[#E6F3FF] border-2 border-[#136C9E] shadow-sm'
                              : isComplete
                              ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                              : 'bg-white border border-gray-200 hover:bg-gray-50'
                          }`}
                          style={{ fontFamily: 'Archivo, sans-serif' }}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCurrentCategory
                                  ? 'bg-[#136C9E] text-white'
                                  : isComplete
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-300 text-gray-600'
                              }`}
                            >
                              {isComplete ? '✓' : index + 1}
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                isCurrentCategory
                                  ? 'text-[#136C9E]'
                                  : isComplete
                                  ? 'text-green-700'
                                  : 'text-gray-800'
                              }`}
                              style={{ fontFamily: 'Archivo, sans-serif' }}
                            >
                              {category}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {categoryChecked}/{categoryDocs.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right side - documents list */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
                  {(() => {
                    const categoryDocs = getCategoryDocuments(selectedCategory);
                    const categoryChecked = categoryDocs.filter((doc) => checked[doc.id]).length;

                    return (
                      <div>
                        <div className="flex justify-between items-center mb-6">
                          <h3 
                            className="text-xl md:text-2xl font-semibold text-gray-900"
                            style={{ fontFamily: 'Archivo, sans-serif', color: '#136C9E' }}
                          >
                            {selectedCategory}
                          </h3>
                          <span className="text-sm font-medium text-gray-600" style={{ fontFamily: 'Archivo, sans-serif' }}>
                            {categoryChecked}/{categoryDocs.length} documents
                          </span>
                        </div>
                        <div className="space-y-3">
                          {categoryDocs.map((doc) => (
                            <label
                              key={doc.id}
                              className="flex items-center p-4 rounded-lg hover:bg-gray-50 cursor-pointer transition"
                            >
                              <input
                                type="checkbox"
                                checked={checked[doc.id] || false}
                                onChange={() => toggleCheck(doc.id)}
                                className="sr-only"
                              />
                              {checked[doc.id] ? (
                                <CheckCircle2 className="h-6 w-6 text-green-600 mr-4 flex-shrink-0" />
                              ) : (
                                <Circle className="h-6 w-6 text-gray-400 mr-4 flex-shrink-0" />
                              )}
                              <span 
                                className={`flex-1 text-sm md:text-base ${
                                  checked[doc.id] ? 'line-through text-gray-500' : 'text-gray-900'
                                }`}
                                style={{ fontFamily: 'Archivo, sans-serif' }}
                              >
                                {doc.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default DocumentTracker;

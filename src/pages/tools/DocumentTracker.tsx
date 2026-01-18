import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import Navbar from '../../components/Navbar';
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
        title="Document Tracker | Proptii"
        description="Track which rental documents you have and what you still need. Organize your rental application documents with our interactive tracker."
        canonical="/tools/document-tracker"
        keywords={['document tracker', 'rental documents', 'tenant documents', 'application checklist']}
        category="Rental Tools"
      />
      
      <div className="min-h-screen font-nunito">
        <Navbar />

        <div className="max-w-4xl mx-auto px-4 py-12">
          <Link
            to="/tools"
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Tools
          </Link>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Document Tracker</h1>
            <p className="text-gray-600 mb-8">
              Track which rental documents you have and what you still need for your application.
            </p>

            {/* Progress Section */}
            <div className="mb-8 bg-gray-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
                <span className="text-2xl font-bold text-indigo-600">{Math.round(percentage)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div
                  className="bg-indigo-600 h-4 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {checkedCount} of {totalItems} documents collected
              </p>
            </div>

            {/* Documents by Category */}
            <div className="space-y-6">
              {categories.map((category) => {
                const categoryDocs = getCategoryDocuments(category);
                const categoryChecked = categoryDocs.filter((doc) => checked[doc.id]).length;
                const categoryPercentage = categoryDocs.length > 0 
                  ? (categoryChecked / categoryDocs.length) * 100 
                  : 0;

                return (
                  <div key={category} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{category}</h3>
                      <span className="text-sm font-medium text-gray-600">
                        {categoryChecked}/{categoryDocs.length}
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
                          <span className={`flex-1 ${checked[doc.id] ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                            {doc.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default DocumentTracker;

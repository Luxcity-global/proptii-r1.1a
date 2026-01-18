import React from 'react';
import { FileText, Download, File } from 'lucide-react';
import { SEO } from '../../components/SEO';

interface Document {
  id: string;
  title: string;
  description: string;
  file: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
  color: string;
}

const documents: Document[] = [
  {
    id: 'how-to-rent',
    title: 'How to Rent Guide',
    description: 'Official DLUHC guide for tenants on renting in England (October 2023)',
    file: '/rental_documents/DLUHC_How_to_rent_Oct2023.pdf',
    icon: FileText,
    category: 'Tenant Guide',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    id: 'right-to-rent-guide',
    title: 'Right to Rent Checks Guide',
    description: 'A guide to immigration documents for tenants and landlords',
    file: '/rental_documents/Right to Rent Checks_ A guide to immigration documents for tenants and landlords.pdf',
    icon: FileText,
    category: 'Legal',
    color: 'bg-green-50 text-green-600',
  },
  {
    id: 'right-to-rent-easy-read',
    title: 'Right to Rent User Guide (Easy Read)',
    description: 'Home Office guide in easy read format for understanding right to rent checks',
    file: '/rental_documents/3286 Home Office Right to Rent User Guide Easy Read v3.pdf',
    icon: FileText,
    category: 'Legal',
    color: 'bg-purple-50 text-purple-600',
  },
  {
    id: 'prescribed-information',
    title: 'Prescribed Information Template',
    description: 'Tenancy deposit scheme prescribed information template (custodial)',
    file: '/rental_documents/1tds-ew-custodial-prescribed-information-template.docx',
    icon: File,
    category: 'Deposit',
    color: 'bg-orange-50 text-orange-600',
  },
  {
    id: 'legionella-assessment',
    title: 'Legionella Risk Assessment Template',
    description: 'Template for conducting legionella risk assessments in rental properties',
    file: '/rental_documents/legionella_Risk_Assessment_template.pdf',
    icon: FileText,
    category: 'Health & Safety',
    color: 'bg-red-50 text-red-600',
  },
];

const RentalDocuments: React.FC = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'UK Rental Documents',
    description: 'Official UK government and legal documents for tenants and landlords',
    itemListElement: documents.map((doc, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'DigitalDocument',
        name: doc.title,
        description: doc.description,
        url: doc.file,
        fileFormat: doc.file.endsWith('.pdf') ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
    })),
  };

  return (
    <>
      <SEO
        title="Rental Documents | Proptii"
        description="Download official UK government rental documents including tenant guides, right to rent checks, deposit templates, and health & safety assessments."
        canonical="/tools#documents"
        keywords={['rental documents', 'UK tenant guide', 'right to rent', 'tenancy deposit', 'legionella assessment']}
        category="Rental Tools"
        structuredData={structuredData}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Rental Documents</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Download official UK government and legal documents to help you navigate the rental process.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {documents.map((doc) => {
            const Icon = doc.icon;
            const isPdf = doc.file.endsWith('.pdf');
            
            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow p-8 flex flex-col"
              >
                <div className={`${doc.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="mb-2">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {doc.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">{doc.title}</h3>
                <p className="text-gray-600 mb-6 flex-grow">{doc.description}</p>
                
                <a
                  href={doc.file}
                  download
                  className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download {isPdf ? 'PDF' : 'DOCX'}
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-12 bg-gray-50 rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-6">
            These documents are provided for informational purposes. For legal advice, please consult a qualified solicitor.
          </p>
        </div>
      </div>
    </>
  );
};

export default RentalDocuments;

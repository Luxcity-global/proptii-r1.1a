import React from 'react';

interface DocumentLink {
  title: string;
  description: string;
  url: string;
  source: string;
}

const documents: DocumentLink[] = [
  {
    title: 'How to Rent: The Checklist for Renting in England',
    description: 'Official government guide for tenants and landlords on rental rights and responsibilities.',
    url: 'https://www.gov.uk/government/publications/how-to-rent',
    source: 'DLUHC',
  },
  {
    title: 'Right to Rent',
    description: 'Guidance for landlords on checking tenant immigration status.',
    url: 'https://www.gov.uk/check-tenant-right-to-rent-documents',
    source: 'Home Office',
  },
  {
    title: 'Deposit Protection',
    description: 'Rules for protecting tenancy deposits and returning them at the end of a tenancy.',
    url: 'https://www.gov.uk/tenancy-deposit-protection',
    source: 'Gov.uk',
  },
  {
    title: 'Energy Performance Certificates',
    description: 'Requirements for EPCs when renting out a property.',
    url: 'https://www.gov.uk/energy-performance-certificate-commercial-property',
    source: 'Gov.uk',
  },
  {
    title: 'Gas Safety',
    description: 'Landlord responsibilities for gas safety checks and certificates.',
    url: 'https://www.gov.uk/guidance/gas-safety-regulations-landlords',
    source: 'Gov.uk',
  },
];

const RentalDocuments: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
          Official UK Rental Documents
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
          Access official UK government publications from DLUHC (Department for Levelling Up, Housing and Communities) and the Home Office. These are the same documents you would find on government websites.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documents.map((doc, index) => (
          <a
            key={index}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl p-6 shadow-md hover:shadow-xl border border-gray-100 transition-all duration-300 hover:-translate-y-1"
          >
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mb-4">
              {doc.source}
            </span>
            <h3 className="text-lg font-bold mb-2" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
              {doc.title}
            </h3>
            <p className="text-gray-600 text-sm mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
              {doc.description}
            </p>
            <span className="text-[#E65D24] font-medium text-sm">
              View on Gov.uk →
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default RentalDocuments;

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
  iconBgColor: string;
  image?: string; // Will be added later when images are provided
}

const documents: Document[] = [
  {
    id: 'how-to-rent',
    title: 'How to Rent Guide',
    description: 'Official DLUHC guide for tenants on renting in England (October 2023)',
    file: '/rental_documents/DLUHC_How_to_rent_Oct2023.pdf',
    icon: FileText,
    category: 'Tenant Guide',
    iconBgColor: 'bg-blue-100',
    image: '/images/How to rent image.png',
  },
  {
    id: 'right-to-rent-guide',
    title: 'Right to Rent Checks Guide',
    description: 'A guide to immigration documents for tenants and landlords',
    file: '/rental_documents/Right to Rent Checks_ A guide to immigration documents for tenants and landlords.pdf',
    icon: FileText,
    category: 'Legal',
    iconBgColor: 'bg-green-100',
    image: '/images/Right to rent cheks guide image.png',
  },
  {
    id: 'right-to-rent-easy-read',
    title: 'Right to Rent User Guide (Easy Read)',
    description: 'Home Office guide in easy read format for understanding right to rent checks',
    file: '/rental_documents/3286 Home Office Right to Rent User Guide Easy Read v3.pdf',
    icon: FileText,
    category: 'Legal',
    iconBgColor: 'bg-purple-100',
    image: '/images/right to rrent user guide.png',
  },
  {
    id: 'prescribed-information',
    title: 'Prescribed Information Template',
    description: 'Tenancy deposit scheme prescribed information template (custodial)',
    file: '/rental_documents/1tds-ew-custodial-prescribed-information-template.docx',
    icon: File,
    category: 'Deposit',
    iconBgColor: 'bg-orange-100',
    image: '/images/Prescribed information template.png',
  },
  {
    id: 'legionella-assessment',
    title: 'Legionella Risk Assessment Template',
    description: 'Template for conducting legionella risk assessments in rental properties',
    file: '/rental_documents/legionella_Risk_Assessment_template.pdf',
    icon: FileText,
    category: 'Health & Safety',
    iconBgColor: 'bg-red-100',
    image: '/images/Legionella Risk Assessment Template.png',
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
        title="Free UK Rental Documents Download | Official Government Guides | Proptii"
        description="Download free official UK government rental documents. Get the How to Rent guide, Right to Rent checks guide, deposit scheme templates, and health & safety assessments. All documents are official publications from DLUHC and Home Office."
        canonical="/tools#documents"
        keywords={[
          'UK rental documents',
          'official rental documents',
          'UK government rental guides',
          'how to rent guide',
          'right to rent documents',
          'tenancy deposit templates',
          'legionella assessment template',
          'UK tenant documents',
          'rental document download',
          'government rental guides',
          'DLUHC rental guide',
          'Home Office rental documents',
          'UK housing documents',
          'tenant document templates'
        ]}
        relatedTerms={[
          'UK rental paperwork',
          'tenant documents',
          'rental application documents',
          'UK housing guides',
          'official tenant resources'
        ]}
        category="Rental Tools"
        structuredData={structuredData}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>Rental Documents</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8" style={{ fontFamily: 'Archivo, sans-serif', color: '#374957' }}>
            Download official UK government and legal documents to help you navigate the rental process.
          </p>
          
          {/* SEO Content Section */}
          <div className="max-w-4xl mx-auto text-left bg-white rounded-2xl p-8 mb-12 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Archivo, sans-serif' }}>
              Official UK Government Rental Documents
            </h3>
            <div className="max-w-none" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }} contentEditable={false}>
              <p className="mb-4">
                All documents available here are official publications from UK government departments, including the Department for Levelling Up, Housing and Communities (DLUHC) and the Home Office. These are the same documents you would find on official government websites, provided here for your convenience.
              </p>
              <p className="mb-4">
                <strong>How to Rent Guide:</strong> The official DLUHC guide for tenants renting in England. This comprehensive guide covers everything from finding a property to ending a tenancy, including your rights and responsibilities, deposit protection, repairs, and eviction procedures. Updated October 2023.
              </p>
              <p className="mb-4">
                <strong>Right to Rent Documents:</strong> UK landlords must verify tenants' right to rent in the UK. We provide both the standard guide and an easy-read version for better accessibility. These guides explain what documents are acceptable and the verification process.
              </p>
              <p className="mb-4">
                <strong>Deposit Templates:</strong> The Tenancy Deposit Scheme prescribed information template helps ensure your deposit is properly registered and protected. This is a legal requirement for landlords in England and Wales.
              </p>
              <p>
                <strong>Health & Safety:</strong> The Legionella Risk Assessment template helps landlords assess and manage the risk of Legionnaires' disease in rental properties. While this is primarily a landlord responsibility, understanding it helps you know what to expect.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {documents.map((doc) => {
            const Icon = doc.icon;
            const isPdf = doc.file.endsWith('.pdf');
            
            return (
              <div
                key={doc.id}
                className="bg-white rounded-3xl shadow-md hover:shadow-xl hover:outline hover:outline-2 hover:outline-[#80B2FF] hover:-translate-y-2 transition-all duration-300 p-8 flex flex-col group border border-gray-100 relative"
              >
                {/* Category Badge - Top Right */}
                <div className="absolute top-4 right-4">
                  <span className={`text-xs font-semibold text-gray-700 uppercase tracking-wide px-3 py-1 rounded-full ${doc.iconBgColor}`}>
                    {doc.category}
                  </span>
                </div>

                {/* Icon with colored background */}
                <div className={`${doc.iconBgColor} w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm relative`}>
                  {doc.image ? (
                    <>
                      <img
                        src={encodeURI(doc.image)}
                        alt={doc.title}
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                          // Hide image and show icon fallback
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'block';
                          }
                        }}
                      />
                      <Icon 
                        className="h-10 w-10 absolute" 
                        style={{ color: '#374957', display: 'none' }}
                      />
                    </>
                  ) : (
                    <Icon className="h-10 w-10" style={{ color: '#374957' }} />
                  )}
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold mb-3 leading-tight" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
                  {doc.title}
                </h3>
                
                {/* Description */}
                <p className="mb-6 text-sm leading-relaxed flex-grow" style={{ color: '#374957', fontFamily: 'Archivo, sans-serif' }}>
                  {doc.description}
                </p>
                
                {/* Button */}
                <a
                  href={doc.file}
                  download
                  className="w-full py-3 px-6 rounded-full border-2 border-[#E65D24] bg-white text-[#E65D24] font-medium text-center group-hover:bg-[#E65D24] group-hover:text-white transition-all duration-300 font-archive inline-flex items-center justify-center"
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

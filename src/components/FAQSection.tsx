import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Home, FileCheck, HelpCircle } from 'lucide-react';

const FAQSection = () => {
  const faqCategories = [
    {
      title: 'Referencing',
      description: 'Verify your documents using our reliable third party partners',
      icon: FileText
    },
    {
      title: 'Viewings',
      description: 'Learn about our streamlined property viewing process',
      icon: Home
    },
    {
      title: 'Contracts',
      description: 'Understanding our contract management system',
      icon: FileCheck
    },
    {
      title: 'General',
      description: 'Common questions about our services',
      icon: HelpCircle
    }
  ];

  return (
    <section className="py-20 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 text-center text-white">
        <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
        <p className="text-gray-300 mb-12 max-w-2xl mx-auto">
          Get quick answers to all your questions and concerns about our service.
          Whether as a tenant or homeowner, we will have an answer waiting for you.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {faqCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg p-6 text-center">
              <div className="text-primary mb-4 flex justify-center">
                <category.icon className="w-8 h-8" />
              </div>
              <h3 className="text-gray-900 font-semibold">{category.title}</h3>
              <p className="text-sm text-gray-600 mt-2">
                {category.description}
              </p>
            </div>
          ))}
        </div>

        <Link
          to="/help"
          className="inline-block mt-12 px-8 py-3 bg-primary text-white rounded-full hover:bg-opacity-90 transition"
        >
          Visit Help Page
        </Link>
      </div>
    </section>
  );
};

export default FAQSection;
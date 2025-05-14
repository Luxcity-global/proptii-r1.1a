import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Home, FileCheck, Search, HelpCircle } from 'lucide-react';

const FAQSection = () => {
  const faqCategories = [
    {
      title: 'General Questions',
      /*description: 'Find answers to common questions about our services.',*/
      icon: HelpCircle,
      link: '/faq#general-questions'
    },
    {
      title: 'Searching',
      /*description: 'Understand how payments and invoices work.',*/
      icon: Search,
      link: '/faq#searching'
    },
    {
      title: 'Referencing',
      /*description: 'Easily verify your documents with trusted partners.',*/
      icon: FileText,
      link: '/faq#referencing'
    },
    {
      title: 'Book Viewings',
      /*description: 'Learn about our seamless property viewing process.',*/
      icon: Home,
      link: '/faq#booking-viewings'
    },
    {
      title: 'Contracts',
      /*description: 'Get clarity on our contract management system.',*/
      icon: FileCheck,
      link: '/faq#contracts'
    }
  ];

  return (
    <section className="py-20 bg-secondary">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-8 text-white">Frequently Asked Questions</h2>
        <p className="text-gray-500 mb-12 max-w-2xl mx-auto">
          Get quick answers to all your questions and concerns about our service.
          Whether as a tenant or homeowner, we will have an answer waiting for you.
        </p>

        {/* Updated Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center">
          {faqCategories.map((category, index) => (
            <Link
              key={index}
              to={category.link}
              className="block w-full max-w-[280px]"
            >
              <div className="bg-white rounded-lg p-6 text-center shadow-lg w-full transform hover:scale-105 transition-all duration-300">
                {/* Small Circle Behind Icon */}
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-[#FFF6F0] flex items-center justify-center rounded-full">
                    <category.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>

                {/* Text Updates */}
                <h3 className="text-[#374957] font-semibold text-lg">{category.title}</h3>
              </div>
            </Link>
          ))}

          {/* Positioning the Button in the Grid */}
          <div className="flex justify-center items-center w-full max-w-[280px]">
            <Link
              to="/help"
              className="inline-block px-8 py-3 bg-primary text-white rounded-full hover:bg-opacity-90 transition text-lg font-medium"
            >
              Visit Help Page
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
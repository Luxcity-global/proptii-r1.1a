import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CookiePolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Hero / Header Section */}
      <section className="bg-[#0A2342] py-16 text-center">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-white font-archivo">
            Cookie Policy
          </h1>
          <p className="text-gray-300 mt-4 text-base md:text-lg max-w-2xl mx-auto font-nunito-sans">
            How Proptii uses cookies and browser storage to deliver our property platform.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="bg-gray-100 py-16 flex-grow font-nunito-sans">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            {/* Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">1. Overview</h2>
              <p className="text-gray-600">
                This Cookie Policy explains how Luxcity UK Ltd, trading as Proptii (“we”, “us”), uses cookies and local browser storage when you use the Proptii website and platform.
              </p>
            </div>

            {/* Strictly Necessary */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">2. Strictly Necessary Storage</h2>
              <p className="text-gray-600">
                We use browser storage that is strictly necessary to provide the service:
              </p>
              <ul className="list-disc list-inside mt-3 space-y-2 text-gray-600">
                <li>
                  <span className="font-semibold text-[#374957]">Authentication & Sign-in:</span> Azure AD B2C / MSAL tokens stored in your browser so you remain securely signed in.
                </li>
                <li>
                  <span className="font-semibold text-[#374957]">Session State:</span> Keys and local state needed so search queries, viewing requests, and referencing forms you submit keep working without losing your place.
                </li>
                <li>
                  <span className="font-semibold text-[#374957]">Notice Preferences:</span> A flag recording whether you have acknowledged our cookie notice.
                </li>
              </ul>
              <p className="text-gray-600 mt-3">
                These essential storage mechanisms do not require consent under UK PECR / GDPR because the service cannot function without them.
              </p>
            </div>

            {/* Analytics */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">3. Analytics</h2>
              <p className="text-gray-600">
                <span className="font-semibold text-[#374957]">Not used at present.</span> We do not set Google Analytics cookies. You can use Proptii without analytics cookies. A later update will let you opt in if we turn analytics on in the future.
              </p>
            </div>

            {/* Maps */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">4. Google Maps</h2>
              <p className="text-gray-600">
                When you use property search, we load Google Maps in your browser so you can view listing locations on a map. That is part of the feature you requested. Google may set cookies or collect technical telemetry according to Google's own privacy notices.
              </p>
            </div>

            {/* Error Reporting */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">5. Error Reporting & Diagnostics</h2>
              <p className="text-gray-600">
                We use Sentry to detect application errors and maintain site reliability. Sentry may receive technical error data, but we strip obvious personal data (such as emails, authorization headers, passwords, and tokens) before transmission.
              </p>
            </div>

            {/* Questions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">6. Questions & Contact</h2>
              <p className="text-gray-600">
                If you have questions about our cookie practices, please contact us at{' '}
                <a href="mailto:contact@luxcity.tech" className="font-bold text-[#374957] hover:underline">
                  contact@luxcity.tech
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default CookiePolicy;

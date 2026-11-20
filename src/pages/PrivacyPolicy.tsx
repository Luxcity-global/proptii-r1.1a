import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

// Add preload link for the hero image
const heroImageUrl = '/images/Privacy-Policy-Hero.png';
const preloadHeroImage = () => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = heroImageUrl;
  document.head.appendChild(link);
};

const PrivacyPolicy = () => {
  // Preload hero image when component mounts
  useEffect(() => {
    preloadHeroImage();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section */}
      <section
        className="relative h-[40vh] bg-cover bg-center overflow-hidden"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src={heroImageUrl}
            alt="Privacy Policy Hero"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="sync"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-[#0A2342]/80"></div>
        </div>
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center pt-20">
          <h1 className="text-5xl md:text-7xl font-bold text-white font-archivo">
            Privacy Policy
          </h1>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="bg-gray-100 py-16 font-nunito-sans">
        <div className="max-w-4xl mx-auto px-4">
          <div className="space-y-6">
            {/* Introduction */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">1. Introduction</h2>
              <p className="text-gray-600">
                Luxcity UK Ltd, trading as Proptii (“we”) provides the Proptii platform. This notice explains how we collect and use personal data when you search for properties, create an account, book a viewing, complete referencing, or sign a contract. We are the data controller for that processing.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">2. Information We Collect</h2>
              <p className="text-gray-600 mb-4">We collect and process the following types of personal data:</p>
              <div className="space-y-3">
                <div className="text-gray-600">
                  <span className="font-bold text-[#374957]">Account Information:</span> Name, email address, phone number, and password.
                </div>
                <div className="text-gray-600">
                  <span className="font-bold text-[#374957]">Property Preferences:</span> Your search history and saved properties.
                </div>
                <div className="text-gray-600">
                  <span className="font-bold text-[#374957]">Booking and Transaction Data:</span> Viewings booked, applications submitted, and contracts signed.
                </div>
                <div className="text-gray-600">
                  <span className="font-bold text-[#374957]">Identity & Verification Data:</span> Government-issued ID, proof of income, and references if required for tenant verification.
                </div>
              </div>
            </div>

            {/* How We Use Your Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">We use your personal data to:</p>
              <div className="space-y-2 text-gray-600">
                <div><span className="font-bold text-[#374957]">A.)</span> Provide and improve our property search and recommendation services.</div>
                <div><span className="font-bold text-[#374957]">B.)</span> Facilitate bookings, tenant verification, and contract signing.</div>
                <div><span className="font-bold text-[#374957]">C.)</span> Communicate with you about updates, confirmations, and customer support.</div>
                <div><span className="font-bold text-[#374957]">D.)</span> Ensure compliance with legal and regulatory requirements.</div>
                <div><span className="font-bold text-[#374957]">E.)</span> Prevent fraud, unauthorized access, and abuse of our platform.</div>
              </div>
            </div>

            {/* Sharing Your Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">4. Sharing Your Information</h2>
              <p className="text-gray-600 mb-4">We only share your data when necessary:</p>
              <div className="space-y-2 text-gray-600">
                <div><span className="font-bold text-[#374957]">A.)</span> With landlords, letting agents, or property managers for rental applications and viewings.</div>
                <div><span className="font-bold text-[#374957]">B.)</span> With identity verification and referencing partners (only when required for tenant screening).</div>
                <div><span className="font-bold text-[#374957]">C.)</span> With payment providers for secure transactions.</div>
                <div><span className="font-bold text-[#374957]">D.)</span> With legal authorities if required by law.</div>
              </div>
              <p className="text-gray-600 mt-4">We do not and will never sell your personal information to third parties.</p>
            </div>

            {/* Who We Share Data With (Processors) */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">5. Who We Share Data With (Processors)</h2>
              <p className="text-gray-600 mb-4">We use other companies to run the service. They only process data on our instructions:</p>
              <div className="space-y-3 text-gray-600">
                <div>
                  <span className="font-bold text-[#374957]">Microsoft:</span> Azure AD B2C (sign-in), Azure hosting, and Azure OpenAI (to interpret search queries; see AI below).
                </div>
                <div>
                  <span className="font-bold text-[#374957]">Google:</span> Google Cloud / Firebase (app data and files); Google Maps (to show a map when you use search).
                </div>
                <div>
                  <span className="font-bold text-[#374957]">Sentry:</span> Application error reports (security and reliability).
                </div>
              </div>
              <p className="text-gray-600 mt-4">
                We do not currently use Google Analytics. If we introduce analytics later, we will only do so with your consent and will update this notice and the Cookie Policy.
              </p>
              <p className="text-gray-600 mt-2">
                If you complete referencing, we may in future share data with a named credit reference agency. We will not run a credit search until that agency is contracted and named to you (see the referencing form).
              </p>
            </div>

            {/* Lawful Bases */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">6. Lawful Bases for Processing</h2>
              <p className="text-gray-600 mb-4">We process personal data under the following lawful bases:</p>
              <div className="space-y-3 text-gray-600">
                <div>
                  <span className="font-bold text-[#374957]">Contract:</span> Creating an account, search that you ask for, booking a viewing, referencing, and contracts.
                </div>
                <div>
                  <span className="font-bold text-[#374957]">Legitimate interests:</span> Security logs, fraud prevention, and diagnosing errors via Sentry (we minimise personal data in those reports).
                </div>
                <div>
                  <span className="font-bold text-[#374957]">Consent:</span> Any future analytics or marketing cookies. You can use the site without that consent.
                </div>
                <div>
                  <span className="font-bold text-[#374957]">Legal obligation:</span> Where the law requires us to keep or disclose information.
                </div>
              </div>
            </div>

            {/* AI and Search */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">7. AI and Search</h2>
              <p className="text-gray-600">
                Property search text you type may be sent to Microsoft Azure OpenAI in Microsoft Azure OpenAI (region to be confirmed) so we can interpret the query. We configure Azure so that data is not used to train public models. Do not paste passport images, bank statements, or other identity documents into search. We do not use a model score to automatically refuse a tenancy.
              </p>
            </div>

            {/* Data Security */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">8. Data Security</h2>
              <p className="text-gray-600">
                We implement industry-standard security measures to protect your data from unauthorized access, loss, or misuse. However, as no online platform is entirely risk-free, we encourage strong password practices and responsible data sharing.
              </p>
            </div>

            {/* Your Rights */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">9. Your Rights</h2>
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <div className="space-y-2 text-gray-600">
                <div><span className="font-bold text-[#374957]">A.)</span> Access, update, or delete your personal information.</div>
                <div><span className="font-bold text-[#374957]">B.)</span> Withdraw consent for processing where applicable.</div>
                <div><span className="font-bold text-[#374957]">C.)</span> Request a copy of the data we hold about you.</div>
                <div><span className="font-bold text-[#374957]">D.)</span> Opt out of marketing communications at any time.</div>
              </div>
              <p className="text-gray-600 mt-4">
                To access, correct, or delete your data, or to object or restrict processing, email <a href="mailto:contact@luxcity.tech" className="font-bold text-[#374957] hover:underline">contact@luxcity.tech</a>. We aim to respond within 30 days. You can also complain to the Information Commissioner's Office (<a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer" className="hover:underline">ico.org.uk</a>). ICO registration: registration in progress.
              </p>
            </div>

            {/* Data Retention */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">10. Data Retention</h2>
              <p className="text-gray-600">
                We retain your data only as long as necessary to provide our services and meet legal obligations. If you close your account, we will delete your data unless retention is required for legal or security reasons.
              </p>
            </div>

            {/* Changes to Privacy Statement */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">11. Changes to This Privacy Statement</h2>
              <p className="text-gray-600">
                We may update this Privacy Statement from time to time. Significant changes will be communicated via email or in-app notifications.
              </p>
            </div>

            {/* Contact Us */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-[#374957] mb-4">12. Contact Us</h2>
              <p className="text-gray-600">
                If you have any questions about this Privacy Statement or your data, please contact us by emailing <a href="mailto:contact@luxcity.tech" className="font-bold text-[#374957] hover:underline">contact@luxcity.tech</a>. We aim to respond within 30 days.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy; 
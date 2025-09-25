import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Link } from 'react-router-dom';
import { Home, Eye, Clipboard } from 'lucide-react';

const AboutUs = () => {
  const [activeTab, setActiveTab] = useState('tenants');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredContact: 'email',
    message: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log('Form submitted:', formData);
  };

  return (
    <div className="min-h-screen font-nunito">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-screen bg-cover bg-center" style={{ backgroundImage: "url('/images/About-Us-Hero.png')" }}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 container mx-auto px-4 h-screen flex flex-col justify-center items-center text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white max-w-5xl leading-tight">
            Let AI Help You Find Your<br />Perfect Place with Ease
          </h1>
          <p className="text-xl md:text-2xl text-white mb-12 max-w-3xl">
            Proptii is an AI-driven platform designed to transform the way people
            navigate the real estate market.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="bg-[#E76F51] hover:bg-[#E76F51]/90 text-white font-semibold px-8 py-3 rounded-md transition duration-300"
            >
              Get Started
            </Link>
            <a
              href="#request-invite"
              className="text-white hover:text-[#E76F51] font-semibold flex items-center gap-2 transition duration-300"
            >
              Request invite
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="bg-white relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:pl-14 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 md:space-x-8">

            <div className="md:w-1/2 text-left space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold font-archive text-[#136C9E]">
                About Us
              </h2>
              <p className="text-lg text-gray-600">
                Proptii is an AI-driven platform designed to transform the way people navigate the real estate market.
              </p>
              <p className="text-lg text-gray-600">
                By blending the power of artificial intelligence with in-depth knowledge of the real estate industry, we provide smarter, faster, and more personalized solutions for tenants, landlords, and agents.
              </p>
            </div>

            <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
              <img
                src="/images/About-us-AI.png"
                alt="AI in Real Estate"
                className="w-full max-w-md h-auto max-h-[500px] object-contain"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 500px"
              />
            </div>

          </div>
        </div>
      </section>

      {/* How We Are Different Section */}
      <section className="py-24 bg-gradient-to-br from-blue-50/50 to-orange-50/50 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="/images/h-w-a-d-bg.png"
            alt="Contracts background"
            className="w-full h-full object-cover"
            loading="lazy"
            sizes="100vw"
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16">
            <span className="text-[#0F2537]">How </span>
            <span className="text-[#136C9E]">We Are Different</span>
          </h2>

          {/* Custom Tab Component */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex bg-white rounded-full shadow-lg p-1.5">
              <button
                className={`px-8 py-3 rounded-full text-base font-medium transition-all duration-300 ${activeTab === "tenants"
                  ? "bg-[#136C9E] text-white shadow-md"
                  : "text-gray-600 hover:text-[#136C9E]"
                  }`}
                onClick={() => setActiveTab("tenants")}
              >
                Tenants
              </button>
              <button
                className={`px-8 py-3 rounded-full text-base font-medium transition-all duration-300 ${activeTab === "agents"
                  ? "bg-[#136C9E] text-white shadow-md"
                  : "text-gray-600 hover:text-[#136C9E]"
                  }`}
                onClick={() => setActiveTab("agents")}
              >
                Agents / Home Owners
              </button>
            </div>

            {/* Display information based on active tab */}
            <div className="mt-8 hidden">
              {activeTab === "tenants" ? (
                <div>Tenants content would go here</div>
              ) : (
                <div>Agents / Home Owners content would go here</div>
              )}
            </div>
          </div>

          {/* Content Area - Modified to make the card wider */}
          <div className="max-w-7xl mx-auto relative">
            {/* Dark blue card - Now wider to allow image overlay */}
            <div className="bg-gradient-to-br from-[#0F2537] to-[#1A3C5C] rounded-3xl p-12 text-white shadow-xl relative z-0 md:w-5/6">
              <div className="md:max-w-md">
                <h3 className="text-3xl font-semibold mb-12">
                  {activeTab === "tenants" ? "For Tenants" : "For Agents / Home Owners"}
                </h3>

                <div className="space-y-8">
                  {activeTab === "tenants" ? (
                    <>
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <Home className="w-6 h-6 text-[#0F2537]" />
                        </div>
                        <span className="text-lg font-medium">Personalized Property Recommendations</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <Eye className="w-6 h-6 text-[#0F2537]" />
                        </div>
                        <span className="text-lg font-medium">Schedule Viewings</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <Clipboard className="w-6 h-6 text-[#0F2537]" />
                        </div>
                        <span className="text-lg font-medium">Streamline Referencing</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <Home className="w-6 h-6 text-[#0F2537]" />
                        </div>
                        <span className="text-lg font-medium">Automate Tenant Verification</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <Eye className="w-6 h-6 text-[#0F2537]" />
                        </div>
                        <span className="text-lg font-medium">Simplify Lease Agreements</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                          <Clipboard className="w-6 h-6 text-[#0F2537]" />
                        </div>
                        <span className="text-lg font-medium">Manage Your Listing Efficiently</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-12">
                  <a
                    href="#request-invite"
                    className="inline-block bg-[#E76F51] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#E76F51]/90 transition duration-300"
                  >
                    Request Invite
                  </a>
                </div>
              </div>
            </div>

            {/* Image - Modified to reduce height and width */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 hidden md:block md:w-2/5 lg:w-1.5/2">
              <img
                src="/images/how-we-are.png"
                alt="Happy family with their new home"
                className="w-full h-2/5 rounded-3xl shadow-xl object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>

            {/* Mobile image (shown only on smaller screens) - Also reduced */}
            <div className="mt-8 md:hidden">
              <img
                src="/images/how-we-are.png"
                alt="Happy family with their new home"
                className="w-4/5 mx-auto rounded-3xl shadow-xl object-cover h-64"
                loading="lazy"
                sizes="80vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Request Invite Section */}
      <section id="request-invite" className="relative py-24 bg-[#1A3C5C]">
        <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('/images/Request.png')" }}></div>

        <div className="relative z-10 container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center text-white mb-16">
            <h3 className="text-2xl font-medium mb-4">Ready to Dive In?</h3>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Request an Invite</h2>
            <p className="text-lg leading-relaxed">
              Be the First to Experience the Future of Real Estate<br />
              Don't miss your chance to transform the way you rent, manage, or list properties.<br />
              Join the movement that's setting new standards in real estate innovation.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label htmlFor="name" className="block text-white text-lg mb-2">
                  First and Last Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
                  required
                />
              </div>

              <div>
                <label htmlFor="preferredContact" className="block text-white text-lg mb-2">
                  Preferred Method of Contact
                </label>
                <select
                  id="preferredContact"
                  name="preferredContact"
                  value={formData.preferredContact}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
                >
                  <option value="email" className="bg-[#1A3C5C]">Email</option>
                  <option value="phone" className="bg-[#1A3C5C]">Phone</option>
                </select>
              </div>

              <div>
                <label htmlFor="email" className="block text-white text-lg mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-white text-lg mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E76F51]"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-white text-lg mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#E76F51] resize-none"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full bg-[#E76F51] hover:bg-[#E76F51]/90 text-white font-semibold py-4 px-8 rounded-lg transition duration-300 text-lg mt-6"
              >
                Request Invite
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs; 
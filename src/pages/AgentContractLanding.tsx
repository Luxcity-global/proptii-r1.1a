import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContractModal from '@/components/contracts/ContractModal';
import { useAuth } from '@/contexts/AuthContext';
import FAQSection from '../components/FAQSection';
import { Link } from 'react-router-dom';

const AgentContractLanding = () => {

    const { isAuthenticated, login } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleGetStarted = () => {
        // Commenting out authentication check for now
        // if (isAuthenticated) {
        setIsModalOpen(true);
        // } else {
        //   login();
        // }
    };

    return (
        <div className="min-h-screen flex flex-col font-nunito">
            <Navbar isAgent={true} />

            {/* Hero Section */}
            <section className="h-[80vh] relative flex items-center">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/modern-building.jpg"
                        alt="Modern building"
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-40"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 text-center text-white w-full">
                    {/* User Type Selection */}
                    <div className="mb-12">
                        <div className="inline-flex rounded-full bg-white p-1 shadow-lg">
                            <Link
                                to="/contracts"
                                className="px-8 py-3 rounded-full text-gray-700 hover:bg-gray-50 font-semibold transition-all"
                            >
                                Tenant
                            </Link>
                            <button className="px-8 py-3 rounded-full bg-[#FFEFD4] text-black font-semibold transition-all">
                                Agent
                            </button>
                        </div>
                    </div>

                    {/* Main Heading */}
                    <h1 className="text-3xl md:text-6xl font-bold mb-6 font-archive leading-tight">
                    Sign, Send, Store. Sorted.
                    </h1>

                    {/* Subheading */}
                    <p className="text-xl md:text-2xl mb-12 max-w-2xl mx-auto font-light">
                    Manage tenant agreements with speed and ease.
                    </p>

                    {/* CTA Button */}
                    <button className="px-8 py-4 bg-[#E65D24] text-white rounded-full text-lg font-semibold hover:bg-opacity-90 transition-all">
                        Get Started
                    </button>
                </div>
            </section>

            {/* Contracts Section */}
            <section className="py-20 bg-white relative overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src="/images/Contract-bg.png"
                        alt="Contracts background"
                        className="w-full h-full object-cover"
                        loading="eager"
                    />
                </div>

                {/* Coming Soon Overlay */}
                <div className="absolute inset-0 z-20 bg-black bg-opacity-70 flex flex-col items-center justify-center">
                    <h3 className="text-4xl md:text-6xl text-white font-bold mb-4 animate-pulse">
                        Coming Soon
                    </h3>
                    <div className="typing-text">
                        <p className="text-xl text-white opacity-80">
                            We're working hard to bring you this feature
                        </p>
                    </div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 md:pl-14 opacity-50">
                    <div className="flex flex-col md:flex-row items-center justify-between space-y-8 md:space-y-0 md:space-x-8">
                        <div className="md:w-1/2 text-left space-y-14">
                            <h2 className="text-4xl md:text-5xl font-bold font-archive text-[#136C9E]">Manage tenant contracts digitally.</h2>
                            <p className="text-lg text-gray-600">
                            From creating agreements to saving signed versions, our platform helps agents keep things organised, professional, and moving fast.
                            </p>
                            <button
                                onClick={handleGetStarted}
                                className="bg-[#E76F51] text-white px-6 py-3 rounded-md hover:bg-opacity-90 transition-all text-lg font-medium"
                                disabled
                            >
                                Get started
                            </button>
                        </div>
                        <div className="md:w-1/2 mt-8 md:mt-0 flex justify-center">
                            <img
                                src="/images/R 9.png"
                                alt="Contract illustration"
                                className="w-2.5/4 h-auto"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/*Contract Modal */}
            {isModalOpen && <ContractModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />}

            <FAQSection />
            <Footer />

            {/* Contracts Modal
            <ContractsManagementModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
            />*/}
        </div>
    );
};

export default AgentContractLanding; 
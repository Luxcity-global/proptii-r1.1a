import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// FAQ Section interface
interface FAQSection {
    title: string;
    icon: string;
    questions: {
        question: string;
        answer: string;
    }[];
}

const FAQ = () => {
    const [openSection, setOpenSection] = useState<string | null>(null);
    const location = useLocation();

    // Effect to handle hash changes and open corresponding section
    useEffect(() => {
        const hash = location.hash.slice(1); // Remove the # from the hash
        if (hash) {
            // Convert hash format to match section title format
            const sectionTitle = hash
                .split('-')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            setOpenSection(sectionTitle);

            // Smooth scroll to the section
            const element = document.getElementById(hash);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location.hash]);

    const faqSections: FAQSection[] = [
        {
            title: "General Questions",
            icon: "/icons/faq.svg",
            questions: [
                {
                    question: "1. What is Proptii?",
                    answer: "Our platform is a proptech solution designed to simplify the rental process for tenants, agents, and landlords. It allows users to search for rental properties, book viewings, handle referencing, and sign contracts all in one place."
                },
                {
                    question: "2. Who can use this platform?",
                    answer: "The platform is built for tenants searching for rental properties and agents or landlords managing listings, tenants, and rental agreements."
                },
                {
                    question: "3. Is the platform available across the UK?",
                    answer: "Yes, our services are available across the UK, making it easy for users to find or list properties nationwide."
                },
                {
                    question: "4. Is the platform free to use?",
                    answer: "Tenants can search for properties and book viewings for free. Agents and landlords may have subscription or usage fees for certain features, such as referencing and contract creation."
                }
            ]
        },
        {
            title: "Searching",
            icon: "/icons/search.svg",
            questions: [
                {
                    question: "How do I find properties?",
                    answer: "Put in your search criteria in plain English, like, 'I want to rent a 3 bedroom house in St Albans'. Our platform utilises AI technology to search different real estate sites and brings results closest to your search criteria."
                }
            ]
        },
        {
            title: "Referencing",
            icon: "/icons/referencing.svg",
            questions: [
                {
                    question: "What is the referencing process for tenants??",
                    answer: "Tenants upload their relevant documents and fill all the forms in the referencing section for review by the agents and/or landlords. In the future, We will partner with trusted providers to conduct tenant referencing automatically. This includes background checks, credit checks, and employment verification. The process is quick and seamless."
                },
                {
                    question: "How long does the referencing process take?",
                    answer: "Referencing typically takes 2-3 business days, depending on the responsiveness of the tenant and their references."
                },
                {
                    question: "What happens if a tenant fails referencing?",
                    answer: "The ultimate decision to rent lies with the agent or landlord. If the tenant fails to meet their requirements, tenants can request for the reason and provide the missing documentation."
                },
                {
                    question: "Is referencing mandatory?",
                    answer: "Yes, referencing is an essential step to ensure both tenants and landlords have a secure rental experience."
                }
            ]
        },
        {
            title: "Booking Viewings",
            icon: "/icons/calendar.svg",
            questions: [
                {
                    question: "How can I book a property viewing?",
                    answer: "Use our booking bot which can be found on the Book Viewings page. Enter the required information including date and time and click 'Book Viewing'. You can initiate the process from a searched listing. The agent or landlord will confirm your appointment and you will be notified."
                },
                {
                    question: "Can I reschedule a viewing?",
                    answer: "Yes, you can reschedule a viewing through the platform by accessing your booking and selecting a new date and time."
                },
                {
                    question: "Will I receive a reminder for my viewing?",
                    answer: "Yes, the platform sends automated reminders to ensure you don't miss your appointment."
                },
                {
                    question: "What happens if the agent or landlord cancels the viewing?",
                    answer: "If a viewing is canceled, you'll be notified immediately, and you can rebook or choose another property to view."
                }
            ]
        },
        {
            title: "Contracts",
            icon: "/icons/contract.svg",
            questions: [
                {
                    question: "How do I sign a rental contract?",
                    answer: "Once referencing is complete, the landlord or agent will send you a digital contract through the platform. You can review and sign it securely online."
                },
                {
                    question: "Are the contracts legally compliant",
                    answer: "Yes, all contracts generated on the platform adhere to UK rental laws and regulations."
                },
                {
                    question: "Can I request changes to the contract?",
                    answer: "If you need adjustments, communicate with the agent or landlord and they will amend as they deem fit."
                }
            ]
        }
    ];

    const toggleSection = (title: string) => {
        setOpenSection(openSection === title ? null : title);
    };

    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            {/* Hero Section */}
            <section
                className="relative h-[80vh] bg-cover bg-center"
                style={{ backgroundImage: 'url("/images/FAQ-Hero.png")' }}
            >
                <div className="absolute inset-0 bg-[#0A2342]/80"></div>
                <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center items-center text-center">
                    <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
                        Frequently Asked Questions
                    </h1>
                    <p className="text-xl text-white max-w-2xl">
                        Get quick answers to all your questions and concerns about our service.
                        Whether as a tenant or homeowner, we will have an answer waiting for you.
                    </p>
                </div>
            </section>

            {/* FAQ Content */}
            <section
                className="py-16 relative bg-[#F8F9FB] scroll-mt-24"
                style={{
                    backgroundImage: 'url("/images/Contract-bg.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundBlendMode: 'overlay',
                    backgroundColor: '#F8F9FB',
                    scrollPaddingTop: '6rem'
                }}
            >
                <div className="max-w-4xl mx-auto px-4">
                    <div className="space-y-4">
                        {faqSections.map((section) => (
                            <div
                                key={section.title}
                                id={section.title.toLowerCase().replace(/\s+/g, '-')}
                                className="bg-white rounded-lg shadow-sm overflow-hidden mb-4"
                            >
                                <button
                                    className={`w-full px-6 py-5 flex items-center justify-between text-left transition-colors duration-200 hover:bg-[#FDF8F3] ${openSection === section.title ? "bg-[#FDF8F3]" : "bg-white"
                                        } ${openSection === section.title ? "border-t border-r border-b border-[#FF6B35]/20 border-l-4 border-l-[#FF6B35]" : "border border-transparent"}`}
                                    onClick={() => toggleSection(section.title)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${openSection === section.title ? "bg-white" : "bg-[#FFEADD]"}`}>
                                            {section.title === "General Questions" && (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M9 9H9.01" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M15 9H15.01" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M9.5 15C10.163 15.6667 11.1 16 12 16C12.9 16 13.837 15.6667 14.5 15" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                            {section.title === "Searching" && (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M21 21L16.65 16.65" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                            {section.title === "Referencing" && (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                            {section.title === "Booking Viewings" && (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M16 2V6" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M8 2V6" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M3 10H21" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                            {section.title === "Contracts" && (
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M14 2V8H20" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M16 13H8" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M16 17H8" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M10 9H9H8" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            )}
                                        </div>
                                        <span className="text-xl font-semibold text-[#0A2342]">{section.title}</span>
                                    </div>
                                    <div className="w-6 h-6 flex items-center justify-center">
                                        {openSection === section.title ? (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M5 12H19" stroke="#0A2342" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        ) : (
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 5V19" stroke="#0A2342" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <path d="M5 12H19" stroke="#0A2342" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        )}
                                    </div>
                                </button>

                                {openSection === section.title && (
                                    <div className="px-6 py-6 bg-white border-b border-r border-l border-[#FF6B35]/20 rounded-b-lg">
                                        <div className="space-y-6">
                                            {section.questions.map((qa, index) => (
                                                <div key={index} className="space-y-3">
                                                    <h3 className="text-[#0A2342] text-lg font-bold">
                                                        {qa.question}
                                                    </h3>
                                                    <p className="text-[#64748B] leading-relaxed">
                                                        {qa.answer}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default FAQ;
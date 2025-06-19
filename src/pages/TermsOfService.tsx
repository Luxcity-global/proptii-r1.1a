import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const TermsOfService = () => {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />
            {/* Hero Section */}
            <section
                className="relative h-[80vh] bg-cover bg-center overflow-hidden"
                style={{ backgroundImage: 'url("/images/Terms-of-Service-Hero.png")' }}
            >
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <img
                        src="/images/Terms-of-Service-Hero.png"
                        alt="Terms of Service Hero"
                        className="w-full h-full object-cover"
                        loading="eager"
                        fetchPriority="high"
                        sizes="100vw"
                    />
                    <div className="absolute inset-0 bg-[#0A2342]/80"></div>
                </div>
                <div className="relative z-10 container mx-auto px-4 h-screen flex flex-col justify-center items-center text-center">
                    <h1 className="text-5xl md:text-7xl font-bold text-white font-archivo">
                        Terms of Service
                    </h1>
                </div>
            </section>

            {/* Terms of Service Content */}
            <section className="bg-gray-100 py-16 font-nunito-sans">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="space-y-6">
                        {/* Introduction */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">1. Introduction</h2>
                            <p className="text-gray-600">
                                Luxcity is used by a platform that allows users to search for rental properties, book viewings, get verified, and sign tenancy agreements. These Terms apply to all users, including tenants, landlords, agents, and property managers.
                            </p>
                        </div>

                        {/* Eligibility */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">2. Eligibility</h2>
                            <p className="text-gray-600 mb-4">To use our services, you must:</p>
                            <div className="space-y-2 text-gray-600">
                                <div><span className="font-bold text-[#374957]">A.</span> Be at least 18 years old.</div>
                                <div><span className="font-bold text-[#374957]">B.</span> Provide accurate and truthful information when registering.</div>
                                <div><span className="font-bold text-[#374957]">C.</span> Use the platform only for its intended purpose.</div>
                            </div>
                        </div>

                        {/* User Accounts */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">3. User Accounts</h2>
                            <div className="space-y-2 text-gray-600">
                                <div><span className="font-bold text-[#374957]">A.</span> You are responsible for maintaining the security of your account.</div>
                                <div><span className="font-bold text-[#374957]">B.</span> You agree to notify us immediately of any unauthorized access or security breach.</div>
                                <div><span className="font-bold text-[#374957]">C.</span> We reserve the right to suspend or terminate accounts that violate these Terms.</div>
                            </div>
                        </div>

                        {/* Services We Provide */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">4. Services We Provide</h2>
                            <p className="text-gray-600 mb-4">Through our platform, you can:</p>
                            <div className="space-y-2 text-gray-600">
                                <div><span className="font-bold text-[#374957]">A.</span> Search for rental properties and send preferences.</div>
                                <div><span className="font-bold text-[#374957]">B.</span> Book property viewings.</div>
                                <div><span className="font-bold text-[#374957]">C.</span> Complete identity verification and tenant referencing.</div>
                                <div><span className="font-bold text-[#374957]">D.</span> Sign tenancy agreements digitally.</div>
                            </div>
                        </div>

                        {/* User Responsibilities */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">5. User Responsibilities</h2>
                            <p className="text-gray-600 mb-4">When using Luxcity, you agree to:</p>
                            <div className="space-y-2 text-gray-600">
                                <div><span className="font-bold text-[#374957]">A.</span> Provide accurate and up-to-date information.</div>
                                <div><span className="font-bold text-[#374957]">B.</span> Respect contracts, agents, and other users during interactions.</div>
                                <div><span className="font-bold text-[#374957]">C.</span> Use the platform legally and ethically.</div>
                                <div><span className="font-bold text-[#374957]">D.</span> Not attempt to manipulate prices or engage in fraudulent activity.</div>
                            </div>
                        </div>

                        {/* Payments & Fees */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">6. Payments & Fees</h2>
                            <p className="text-gray-600 mb-4">Some services, such as tenant verification or booking fees, may require payment. By using these services, you agree that:</p>
                            <div className="space-y-2 text-gray-600">
                                <div><span className="font-bold text-[#374957]">A.</span> Payments are processed through secure third-party providers.</div>
                                <div><span className="font-bold text-[#374957]">B.</span> Fees are non-refundable unless stated otherwise.</div>
                                <div><span className="font-bold text-[#374957]">C.</span> Any disputes should be reported within 14 days of the transaction.</div>
                            </div>
                        </div>

                        {/* Tenant Verification & Referencing */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">7. Tenant Verification & Referencing</h2>
                            <p className="text-gray-600 mb-4">To proceed with property applications and secure your tenancy, tenants may require to complete identity verification and referencing. This process may include:</p>
                            <div className="space-y-2 text-gray-600">
                                <div><span className="font-bold text-[#374957]">A.</span> Background checks (e.g., credit, employment, rental history).</div>
                                <div><span className="font-bold text-[#374957]">B.</span> Uploading identification and proof of income.</div>
                                <div><span className="font-bold text-[#374957]">C.</span> Consenting to the processing of your data by third-party verification providers.</div>
                            </div>
                        </div>

                        {/* Limitation of Liability */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">8. Limitation of Liability</h2>
                            <p className="text-gray-600 mb-4">We strive to provide a reliable platform, but we are not responsible for:</p>
                            <div className="space-y-2 text-gray-600">
                                <div><span className="font-bold text-[#374957]">A.</span> The accuracy of property listings.</div>
                                <div><span className="font-bold text-[#374957]">B.</span> Action taken by landlords, tenants, or agents.</div>
                                <div><span className="font-bold text-[#374957]">C.</span> Any loss, damage, or legal disputes arising from rental agreements.</div>
                            </div>
                        </div>

                        {/* Termination & Suspension */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">9. Termination & Suspension</h2>
                            <p className="text-gray-600 mb-4">We reserve the right to:</p>
                            <div className="space-y-2 text-gray-600">
                                <div><span className="font-bold text-[#374957]">A.</span> Suspend or terminate accounts that violate these Terms.</div>
                                <div><span className="font-bold text-[#374957]">B.</span> Remove fraudulent listings or block abusive users.</div>
                                <div><span className="font-bold text-[#374957]">C.</span> Modify or discontinue our service at any time.</div>
                            </div>
                        </div>

                        {/* Intellectual Property */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">10. Intellectual Property</h2>
                            <p className="text-gray-600">
                                All content on our platform (logos, text, design, and software) is owned by Luxcity UK Ltd and protected by intellectual property laws. You may not copy, modify, or distribute our content without permission.
                            </p>
                        </div>

                        {/* Privacy */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">11. Privacy</h2>
                            <p className="text-gray-600">
                                Our use of your data is governed by our Privacy Policy - which explains how we collect, use, and protect your personal information.
                            </p>
                        </div>

                        {/* Dispute Resolution */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">12. Dispute Resolution</h2>
                            <p className="text-gray-600">
                                If a dispute arises, we encourage users to contact us first to seek resolution. If unresolved, disputes will be governed by the laws of the United Kingdom and any legal action must be brought in the United Kingdom.
                            </p>
                        </div>

                        {/* Changes to These Terms */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">13. Changes to These Terms</h2>
                            <p className="text-gray-600">
                                We may update these Terms from time to time. Continued use of our platform after changes means you accept the revised Terms. Major changes will be notified via email or app notification.
                            </p>
                        </div>

                        {/* Contact Us */}
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h2 className="text-2xl font-bold text-[#374957] mb-4">14. Contact Us</h2>
                            <p className="text-gray-600">
                                If you have any questions about these Terms, please contact us at <a href="mailto:contact@luxcity.tech" className="font-bold text-[#374957] hover:underline">contact@luxcity.tech</a>
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default TermsOfService; 
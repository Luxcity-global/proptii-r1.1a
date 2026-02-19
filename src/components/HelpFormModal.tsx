import React, { useState } from 'react';
import { X } from 'lucide-react';
import { firestoreService } from '../services/firestoreService';

interface HelpFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FormData {
    subject: string;
    heading: string;
    body: string;
    email: string;
}

const HelpFormModal: React.FC<HelpFormModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState<FormData>({
        subject: '',
        heading: '',
        body: '',
        email: ''
    });
    const [showSuccess, setShowSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setShowSuccess(false);
        setIsSubmitting(true);

        try {
            console.log('Submitting support form...');

            // Step 1: Save to Firestore
            console.log('Saving to Firestore...');
            const firestoreResult = await firestoreService.saveSupportForm(formData);
            
            if (firestoreResult.success) {
                console.log('✅ Support form saved to Firestore successfully');
            } else {
                console.warn('⚠️ Failed to save to Firestore:', firestoreResult.error);
                // Continue with email even if Firestore fails
            }

            // Step 2: Send email using EXISTING /api/email/send endpoint (from server/index.js)
            console.log('Sending email...');
            
            // Generate HTML email template
            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                        }
                        .header {
                            background-color: #0A2342;
                            color: white;
                            padding: 30px;
                            text-align: center;
                            border-radius: 8px 8px 0 0;
                        }
                        .content {
                            background-color: #f9f9f9;
                            padding: 30px;
                            border: 1px solid #ddd;
                            border-top: none;
                            border-radius: 0 0 8px 8px;
                        }
                        .field {
                            margin-bottom: 20px;
                            padding: 15px;
                            background-color: white;
                            border-left: 4px solid #FF6B35;
                            border-radius: 4px;
                        }
                        .field-label {
                            font-weight: bold;
                            color: #0A2342;
                            margin-bottom: 5px;
                            font-size: 14px;
                            text-transform: uppercase;
                        }
                        .field-value {
                            color: #555;
                            margin-top: 8px;
                            font-size: 15px;
                        }
                        .footer {
                            text-align: center;
                            padding: 20px;
                            color: #888;
                            font-size: 12px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1 style="margin: 0;">New Support Request</h1>
                        <p style="margin: 10px 0 0 0; opacity: 0.9;">FAQ Contact Form Submission</p>
                    </div>
                    <div class="content">
                        <div class="field">
                            <div class="field-label">Subject</div>
                            <div class="field-value">${formData.subject}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">Heading</div>
                            <div class="field-value">${formData.heading}</div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">User Email</div>
                            <div class="field-value"><a href="mailto:${formData.email}" style="color: #FF6B35;">${formData.email}</a></div>
                        </div>
                        
                        <div class="field">
                            <div class="field-label">Message</div>
                            <div class="field-value" style="white-space: pre-wrap;">${formData.body}</div>
                        </div>
                    </div>
                    <div class="footer">
                        <p>This is an automated message from the Proptii Support System</p>
                        <p>© ${new Date().getFullYear()} Proptii. All rights reserved.</p>
                    </div>
                </body>
                </html>
            `;
            
            // Use the EXISTING email server endpoint (server/index.js)
            // This is the same one your working modals use
            const emailServerUrl = window.location.hostname === 'localhost' 
                ? 'http://localhost:3002'
                : 'https://proptii-r11a-production-0c93.up.railway.app';
            
            const emailEndpoint = `${emailServerUrl}/api/email/send`;
            console.log('Sending email to:', emailEndpoint);
            
            const emailResponse = await fetch(emailEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    to: 'contactus@theluxcity.co.uk',
                    subject: `[Support Request] ${formData.subject} - ${formData.heading}`,
                    html: emailHtml
                })
            });

            if (!emailResponse.ok) {
                const errorData = await emailResponse.json().catch(() => ({ error: 'Failed to send email' }));
                throw new Error(errorData.error || 'Failed to send email');
            }

            const emailResult = await emailResponse.json();
            console.log('✅ Email sent successfully:', emailResult);

            // Show success message
            setShowSuccess(true);
        } catch (err) {
            console.error('Form submission error:', err);
            alert('There was an error submitting your request. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
        setFormData({ subject: '', heading: '', body: '', email: '' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-2xl mx-4 relative">
                    {/* Header */}
                    <div className="bg-[#0F2537] text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
                        <h2 className="text-xl font-semibold">Contact Support</h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-gray-300 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Subject */}
                        <div>
                            <label className="block text-gray-700 mb-2 font-medium">
                                Subject
                            </label>
                            <select
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#136C9E] focus:border-transparent"
                                required
                            >
                                <option value="">Select a subject</option>
                                <option value="general">General Inquiry</option>
                                <option value="technical">Technical Support</option>
                                <option value="feedback">Feedback</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        {/* Heading */}
                        <div>
                            <label className="block text-gray-700 mb-2 font-medium">
                                Heading
                            </label>
                            <input
                                type="text"
                                value={formData.heading}
                                onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                                placeholder="Brief description of your inquiry"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#136C9E] focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Body */}
                        <div>
                            <label className="block text-gray-700 mb-2 font-medium">
                                Message
                            </label>
                            <textarea
                                value={formData.body}
                                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                placeholder="Please provide details about your inquiry"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#136C9E] focus:border-transparent h-32 resize-none"
                                required
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-gray-700 mb-2 font-medium">
                                Your Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="Enter your email address"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#136C9E] focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-center pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-[#FF6B35] text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Success Dialog */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg w-full max-w-md mx-4">
                        <div className="px-6 py-4 flex justify-between items-center border-b">
                            <h3 className="text-xl font-semibold text-[#374957]">Message Sent Successfully</h3>
                            <button
                                onClick={handleSuccessClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="px-6 py-4">
                            <p className="text-gray-600 mt-2">
                                Thank you for reaching out. Our support team will review your message and get back to you shortly.
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end">
                            <button
                                onClick={handleSuccessClose}
                                className="bg-[#136C9E] text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default HelpFormModal; 
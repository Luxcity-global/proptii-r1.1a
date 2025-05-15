import React, { useState } from 'react';
import { X } from 'lucide-react';

interface HelpFormModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface FormData {
    subject: string;
    heading: string;
    body: string;
}

const HelpFormModal: React.FC<HelpFormModalProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState<FormData>({
        subject: '',
        heading: '',
        body: ''
    });
    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle form submission here
        console.log('Form submitted:', formData);
        // Show success message
        setShowSuccess(true);
    };

    const handleSuccessClose = () => {
        setShowSuccess(false);
        setFormData({ subject: '', heading: '', body: '' });
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

                        {/* Submit Button */}
                        <div className="flex justify-center pt-4">
                            <button
                                type="submit"
                                className="bg-[#FF6B35] text-white px-8 py-3 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
                            >
                                Submit
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
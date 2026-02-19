import React, { useState, useEffect } from 'react';

interface DocumentChecklistModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGetStarted: () => void;
}

const DocumentChecklistModal: React.FC<DocumentChecklistModalProps> = ({
    isOpen,
    onClose,
    onGetStarted
}) => {
    const [dontShowAgain, setDontShowAgain] = useState(false);

    useEffect(() => {
        // Check if user has previously chosen to not show the checklist
        const shouldSkip = localStorage.getItem('skipDocumentChecklist') === 'true';
        if (shouldSkip && isOpen) {
            onGetStarted();
            onClose();
        }
    }, [isOpen, onGetStarted, onClose]);

    const handleGetStarted = () => {
        if (dontShowAgain) {
            localStorage.setItem('skipDocumentChecklist', 'true');
        }
        onGetStarted();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl w-full max-w-[420px] mx-2 p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 z-10"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Title */}
                <h2 className="text-xl sm:text-2xl font-bold text-center text-[#2D4356] mb-2 sm:mb-3 pr-8">
                    Your Document Checklist
                </h2>

                {/* Subtitle */}
                <p className="text-sm sm:text-base text-center text-gray-600 mb-3 sm:mb-4 px-2">
                    To complete your referencing, have these documents ready for upload
                </p>

                {/* Document List */}
                <div className="bg-[#F8F9FF] rounded-xl p-3 sm:p-4 mb-3 sm:mb-4 border-2 border-[#136C9E]">
                    <ul className="space-y-2 sm:space-y-2.5">
                        {[
                            'Your passport or drivers license',
                            'Pay slips and employment contract',
                            'Your current residence utility bill',
                            '6 month\'s bank statement',
                            'Your guarantor\'s passport or drivers license'
                        ].map((item, index) => (
                            <li key={index} className="flex items-start space-x-2">
                                <div className="flex-shrink-0 mt-0.5">
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-green-600 rounded flex items-center justify-center">
                                        <svg
                                            className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <span className="text-sm sm:text-base text-[#2D4356] leading-relaxed">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Note Section */}
                <div className="bg-[#F8F9FF] rounded-xl p-3 sm:p-4 mb-3 sm:mb-4">
                    <div className="flex items-center space-x-2 mb-1">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm sm:text-base font-semibold text-blue-600">Note</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                        Accepted document formats: PDF, DOC, DOCX, JPG, JPEG, PNG
                    </p>
                </div>

                {/* Don't show again checkbox */}
                <div className="flex items-start mb-4 px-1">
                    <input
                        type="checkbox"
                        id="dontShowAgain"
                        checked={dontShowAgain}
                        onChange={(e) => setDontShowAgain(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5 flex-shrink-0"
                    />
                    <label htmlFor="dontShowAgain" className="ml-2 text-xs sm:text-sm text-gray-700 leading-relaxed">
                        Don't show me this window again
                    </label>
                </div>

                {/* Get Started button container */}
                <div className="flex justify-center sm:justify-start">
                    <button
                        onClick={handleGetStarted}
                        className="bg-[#E65D24] text-white text-sm sm:text-base py-2.5 px-6 sm:px-8 rounded-xl hover:bg-opacity-90 transition-all w-full sm:w-auto"
                        style={{ fontFamily: 'Archivo, sans-serif' }}
                    >
                        Get Started
                    </button>
                </div>

            </div>
        </div>
    );
};

export default DocumentChecklistModal; 
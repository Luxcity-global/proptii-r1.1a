import React, { useState, useRef } from 'react';
import { Zap, Upload, Loader2 } from 'lucide-react';
import openRouterService, { ExtractedData } from '../../../services/openRouterService';
import { toast } from 'react-hot-toast';

interface QuickFillBannerProps {
    onDataExtracted: (data: ExtractedData) => void;
}

const QuickFillBanner: React.FC<QuickFillBannerProps> = ({ onDataExtracted }) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        console.log('File selected for AI extraction:', file.name, file.type);
        setIsProcessing(true);
        const toastId = toast.loading('AI is analyzing your document...');

        try {
            const extractedData = await openRouterService.extractDataFromDocument(file);
            console.log('Successfully received data from AI service');
            if (extractedData) {
                onDataExtracted(extractedData);
                toast.success('Fields auto-filled successfully!', { id: toastId });
            } else {
                toast.error('Could not extract data from this document.', { id: toastId });
            }
        } catch (error) {
            console.error('AI Extraction error during handleFileChange:', error);
            toast.error('Failed to process document. Please try manual entry.', { id: toastId });
        } finally {
            setIsProcessing(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="bg-[#004E70] rounded-2xl p-6 mb-8 relative overflow-hidden text-white shadow-xl border border-blue-400/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-start gap-4">
                    <div className="bg-[#E65D24] p-3 rounded-xl shadow-lg mt-1 shrink-0">
                        <Zap size={24} className="text-white fill-white" />
                    </div>
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold mb-2">Quick Fill with AI</h3>
                        <p className="text-blue-100 text-sm md:text-base max-w-md leading-relaxed opacity-90">
                            Upload your Passport, ID, or CV and our AI will automatically populate your name, contact details, and work history.
                        </p>
                    </div>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                    <button
                        onClick={handleButtonClick}
                        disabled={isProcessing}
                        className={`w-full md:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${isProcessing
                                ? 'bg-blue-100 text-[#004E70] opacity-90 cursor-not-allowed'
                                : 'bg-white text-[#004E70] hover:bg-blue-50 hover:shadow-xl'
                            }`}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                <span>AI is extracting...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={20} />
                                <span>Upload & Auto-Fill</span>
                            </>
                        )}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,.pdf"
                        className="hidden"
                    />
                </div>
            </div>

            {/* Decorative elements to match the "rich aesthetics" requirement */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
        </div>
    );
};

export default QuickFillBanner;

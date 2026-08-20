import React, { useState, useRef } from 'react';
import { Zap, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import openRouterService, { ExtractedData } from '../../../services/openRouterService';
import { uploadToFirebaseStorage } from '../../../services/storageService';
import { toast } from 'react-hot-toast';

export interface StoredDocument {
    name: string;
    type: string;
    size: number;
    lastModified: number;
    url?: string;
}

interface QuickFillBannerProps {
    onDataExtracted: (data: ExtractedData, attachedDoc?: StoredDocument) => void;
    sectionKey?: string;
    descriptionText?: string;
}

const QuickFillBanner: React.FC<QuickFillBannerProps> = ({ 
    onDataExtracted, 
    sectionKey = 'identity',
    descriptionText 
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastUploadedName, setLastUploadedName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const toastId = toast.loading('AI is analyzing and attaching your document...');

        try {
            // 1. Concurrently run AI extraction and Firebase Storage upload
            const [extractedData, uploadResult] = await Promise.all([
                openRouterService.extractDataFromDocument(file).catch(err => {
                    console.warn('AI Extraction error:', err);
                    return null;
                }),
                uploadToFirebaseStorage(file, `referencing_documents/${sectionKey}`).catch(err => {
                    console.warn('Upload error:', err);
                    return { success: false, url: '' };
                })
            ]);

            const docUrl = (uploadResult && uploadResult.success && uploadResult.url) 
                ? uploadResult.url 
                : URL.createObjectURL(file);

            const attachedDoc: StoredDocument = {
                name: file.name,
                type: file.type,
                size: file.size,
                lastModified: file.lastModified,
                url: docUrl
            };

            setLastUploadedName(file.name);

            if (extractedData || attachedDoc.url) {
                onDataExtracted(extractedData || {}, attachedDoc);
                toast.success('Document attached & details extracted!', { id: toastId });
            } else {
                toast.error('Could not process this document. Please enter manually.', { id: toastId });
            }
        } catch (error) {
            console.error('AI Extraction & Upload error:', error);
            toast.error('Failed to process document. Please try manual entry.', { id: toastId });
        } finally {
            setIsProcessing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    return (
        <div className="bg-[#004E70] rounded-2xl p-5 sm:p-6 mb-6 relative overflow-hidden text-white shadow-md border border-blue-400/20">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
                <div className="flex items-start gap-3.5">
                    <div className="bg-[#E65D24] p-2.5 rounded-xl shadow-md mt-0.5 shrink-0">
                        <Zap size={22} className="text-white fill-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg sm:text-xl font-bold">Quick Fill &amp; Auto-Attach</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                                AI Assist
                            </span>
                        </div>
                        <p className="text-blue-100 text-xs sm:text-sm max-w-md leading-relaxed mt-1 opacity-90">
                            {descriptionText || "Upload your Passport, Payslip, or Proof of Address. Our AI will automatically populate form details and attach the document for you."}
                        </p>
                        {lastUploadedName && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium">
                                <CheckCircle2 size={13} className="text-emerald-300" />
                                <span>Attached: {lastUploadedName}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                    <button
                        onClick={handleButtonClick}
                        disabled={isProcessing}
                        className={`w-full md:w-auto flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 cursor-pointer ${
                            isProcessing
                                ? 'bg-blue-100 text-[#004E70] opacity-90 cursor-not-allowed'
                                : 'bg-white text-[#004E70] hover:bg-blue-50 hover:shadow-lg'
                        }`}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 size={18} className="animate-spin text-[#004E70]" />
                                <span>Analyzing &amp; Uploading...</span>
                            </>
                        ) : (
                            <>
                                <Upload size={18} />
                                <span>Upload &amp; Auto-Fill</span>
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

            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12 pointer-events-none"></div>
        </div>
    );
};

export default QuickFillBanner;

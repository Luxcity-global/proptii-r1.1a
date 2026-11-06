import apiService from './api';

export interface ExtractedData {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    dateOfBirth?: string;
    nationality?: string;
    employmentStatus?: string;
    jobPosition?: string;
    companyDetails?: string;
    currentAddress?: string;
    monthlyIncome?: string;
}

const LOCAL_AI_EXTRACT_URL = 'http://127.0.0.1:3002/api/referencing/ai-extract';

/**
 * In local dev, AI extraction goes to the local backend even when the rest of the app
 * uses a remote API (VITE_USE_REMOTE_API=true). Override with VITE_AI_EXTRACT_URL,
 * or set it to "remote" to use the main API base URL. Production builds are unaffected.
 */
function aiExtractUrl(): string {
    const override = (import.meta.env.VITE_AI_EXTRACT_URL || '').trim();
    if (override === 'remote') return '/referencing/ai-extract';
    if (override) return override;
    const onLocalhost = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
    return import.meta.env.DEV && onLocalhost ? LOCAL_AI_EXTRACT_URL : '/referencing/ai-extract';
}

/**
 * Service to extract data from documents using Gemini via the backend
 */
class OpenRouterService {
    /**
     * Extracts information from a document (image or PDF)
     * @param file The file to extract data from
     * @returns Structured data if successful
     */
    async extractDataFromDocument(file: File): Promise<ExtractedData | null> {
        try {
            // Multipart, not base64 JSON: the backend caps JSON bodies at 1MB, which most scans exceed.
            const formData = new FormData();
            formData.append('file', file);

            const url = aiExtractUrl();
            console.log('Sending AI extraction request to backend:', url);

            const response = await apiService.post<any>(
                url,
                formData,
                { timeout: 90000 }
            );

            if (response.data && response.data.success) {
                console.log('Successfully received data from backend AI service');
                return response.data.data as ExtractedData;
            } else {
                console.error('Backend returned an unsuccessful response:', response.data);
                throw new Error(response.data?.error || 'AI extraction failed in backend');
            }
        } catch (error: any) {
            console.error('Backend AI Extraction Error:', error);
            if (error.status) {
                console.error('Error Details:', error.message, error.errors);
            }
            throw error;
        }
    }
}

export default new OpenRouterService();

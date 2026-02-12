import axios from 'axios';

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

/**
 * Service to extract data from documents using Gemini 2.5 Flash via OpenRouter
 */
class OpenRouterService {
    /**
     * Extracts information from a document (image or PDF)
     * @param file The file to extract data from
     * @returns Structured data if successful
     */
    async extractDataFromDocument(file: File): Promise<ExtractedData | null> {
        try {
            // Convert file to base64
            const base64Data = await this.fileToBase64(file);
            const mimeType = file.type;

            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
            console.log('Sending AI extraction request to backend:', API_URL);

            const response = await axios.post(
                `${API_URL}/api/referencing/ai-extract`,
                { base64Data, mimeType },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (response.data && response.data.success) {
                console.log('Successfully received data from backend AI service');
                return response.data.data as ExtractedData;
            } else {
                console.error('Backend returned an unsuccessful response:', response.data);
                throw new Error('AI extraction failed in backend');
            }
        } catch (error) {
            console.error('Backend AI Extraction Error:', error);
            if (axios.isAxiosError(error)) {
                console.error('Error Details:', error.response?.data);
            }
            throw error;
        }
    }

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove the prefix (e.g., "data:image/jpeg;base64,")
                const base64 = result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    }
}

export default new OpenRouterService();

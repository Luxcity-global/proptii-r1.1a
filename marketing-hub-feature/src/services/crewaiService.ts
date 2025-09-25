/**
 * CrewAI Frontend Service
 * Handles communication with CrewAI backend service
 */

// import { io, Socket } from 'socket.io-client';

export interface PropertyData {
  propertyId: string;
  address: string;
  postcode: string;
  propertyType: string;
  price: number;
  tenure: string;
  bedrooms: number;
  bathrooms: number;
  receptionRooms?: number;
  totalRooms?: number;
  floorArea?: number;
  features: string[];
  garden: boolean;
  parking: boolean;
  balcony: boolean;
  fireplace: boolean;
  epcRating: string;
  councilTaxBand: string;
  locationFeatures: string[];
  transportLinks: string[];
  images?: any[];
  agentName?: string;
  agentPhone?: string;
  agentEmail?: string;
  marketNotes?: string;
  sellingPoints: string[];
}

export interface CrewAIJobResponse {
  success: boolean;
  jobId: string;
  sessionId: string;
  status: string;
  error?: string;
}

export interface CrewAIJobStatus {
  success: boolean;
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  result?: any;
  error?: string;
}

export interface CrewAIWebSocketMessage {
  type: 'job_update' | 'job_complete' | 'job_error';
  job_id: string;
  status: string;
  progress: number;
  message?: string;
  result?: any;
  error?: string;
}

export type ProgressCallback = (progress: number, message: string) => void;
export type CompletionCallback = (result: any) => void;
export type ErrorCallback = (error: string) => void;

class CrewAIService {
  private baseUrl: string;
  private wsUrl: string;
  // private socket: Socket | null = null;
  private sessionId: string | null = null;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '/api';
    this.wsUrl = import.meta.env.VITE_CREWAI_WS_URL || 'ws://localhost:8202';
  }

  /**
   * Generate property marketing content using CrewAI
   */
  async generatePropertyContent(
    propertyData: PropertyData,
    platforms: string[] = ['facebook', 'instagram'],
    progressCallback?: ProgressCallback,
    completionCallback?: CompletionCallback,
    errorCallback?: ErrorCallback
  ): Promise<CrewAIJobResponse> {
    try {
      // Generate session ID
      this.sessionId = this.generateSessionId();

      console.log('🚀 Generating property content with CrewAI:', {
        propertyId: propertyData.propertyId,
        platforms: platforms,
        sessionId: this.sessionId
      });

      // Send request to backend
      const response = await fetch(`${this.baseUrl}/crewai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyData,
          platforms,
          sessionId: this.sessionId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const result: CrewAIJobResponse = await response.json();

      if (result.success && result.jobId) {
        // For now, simulate the generation process
        this.simulateGeneration(result.jobId, progressCallback, completionCallback, errorCallback);

        return result;
      } else {
        throw new Error(result.error || 'Failed to generate content');
      }

    } catch (error) {
      console.error('❌ CrewAI generation error:', error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId: string): Promise<CrewAIJobStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/crewai/jobs/${jobId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get job status');
      }

      const result: CrewAIJobStatus = await response.json();
      return result;

    } catch (error) {
      console.error('❌ Error getting job status:', error);
      throw error;
    }
  }

  /**
   * Simulate generation process (for development)
   */
  private simulateGeneration(
    jobId: string,
    progressCallback?: ProgressCallback,
    completionCallback?: CompletionCallback,
    errorCallback?: ErrorCallback
  ): void {
    const steps = [
      { progress: 10, message: 'Analyzing property data...' },
      { progress: 30, message: 'Generating content for platforms...' },
      { progress: 60, message: 'Validating compliance...' },
      { progress: 80, message: 'Finalizing content...' },
      { progress: 100, message: 'Generation complete!' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        const step = steps[currentStep];
        if (progressCallback) {
          progressCallback(step.progress, step.message);
        }
        currentStep++;
      } else {
        clearInterval(interval);
        if (completionCallback) {
          completionCallback({
            property_id: 'prop_123',
            platforms: ['facebook', 'instagram'],
            content_by_platform: {
              facebook: {
                headline: 'Stunning 3-Bedroom House in Prime Location',
                description: 'Discover this beautiful 3-bedroom house in London. Perfect for families with modern features, garden, and parking. Excellent transport links and near top schools.',
                key_features: ['3 Bedrooms', '2 Bathrooms', 'Garden', 'Parking', 'Modern Kitchen'],
                call_to_action: 'Contact us today to arrange a viewing',
                hashtags: ['#property', '#london', '#house', '#family', '#modern']
              },
              instagram: {
                headline: 'Dream Home Alert!',
                description: 'This stunning 3-bedroom house is perfect for your family! Modern features, beautiful garden, and parking included. Located in prime London with excellent schools nearby.',
                key_features: ['3 Bedrooms', '2 Bathrooms', 'Garden', 'Parking', 'Modern Kitchen'],
                call_to_action: 'DM us to arrange a viewing!',
                hashtags: ['#property', '#london', '#dreamhome', '#family', '#modern']
              }
            },
            compliance_report: {
              is_compliant: true,
              compliance_score: 95
            }
          });
        }
      }
    }, 1000);
  }

  /**
   * Disconnect WebSocket (placeholder for now)
   */
  disconnectWebSocket(): void {
    // WebSocket functionality disabled for now
    this.sessionId = null;
    console.log('📡 WebSocket functionality disabled');
  }

  /**
   * Health check for CrewAI service
   */
  async healthCheck(): Promise<{ healthy: boolean; service?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/crewai/health`);
      
      if (!response.ok) {
        return { healthy: false, error: 'CrewAI service not available' };
      }

      const result = await response.json();
      return { healthy: true, service: result.service };

    } catch (error) {
      console.error('❌ CrewAI health check error:', error);
      return { healthy: false, error: 'Connection failed' };
    }
  }

  /**
   * Get CrewAI service capabilities
   */
  async getCapabilities(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/crewai/capabilities`);
      
      if (!response.ok) {
        throw new Error('Failed to get capabilities');
      }

      const result = await response.json();
      return result.capabilities;

    } catch (error) {
      console.error('❌ Error getting CrewAI capabilities:', error);
      throw error;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.disconnectWebSocket();
  }
}

// Create singleton instance
const crewaiService = new CrewAIService();
export default crewaiService;

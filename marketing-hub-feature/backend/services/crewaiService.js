/**
 * CrewAI Service Integration
 * Handles communication with the CrewAI Python service
 */

const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');

class CrewAIService extends EventEmitter {
  constructor() {
    super();
    this.baseUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8002';
    this.wsUrl = process.env.CREWAI_WS_URL || 'ws://localhost:8002';
    this.wsConnections = new Map(); // sessionId -> WebSocket
    this.requestTimeout = 30000; // 30 seconds
  }

  /**
   * Generate property marketing content using CrewAI
   */
  async generatePropertyContent(propertyData, platforms = ['facebook', 'instagram'], sessionId = null) {
    try {
      const requestData = {
        property_data: this.formatPropertyData(propertyData),
        platforms: platforms,
        user_id: propertyData.userId || 'anonymous',
        session_id: sessionId || this.generateSessionId()
      };

      console.log('🚀 Sending request to CrewAI service:', {
        property_id: propertyData.propertyId,
        platforms: platforms,
        session_id: requestData.session_id
      });

      const response = await axios.post(
        `${this.baseUrl}/api/v1/generate`,
        requestData,
        {
          timeout: this.requestTimeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.job_id) {
        console.log('✅ CrewAI job created:', response.data.job_id);
        
        // Set up WebSocket connection for real-time updates
        if (sessionId) {
          await this.connectWebSocket(requestData.session_id);
        }

        return {
          success: true,
          jobId: response.data.job_id,
          sessionId: requestData.session_id,
          status: 'queued'
        };
      } else {
        throw new Error('Invalid response from CrewAI service');
      }

    } catch (error) {
      console.error('❌ CrewAI service error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('CrewAI service is not available. Please check if the service is running.');
      }
      
      if (error.response) {
        throw new Error(`CrewAI service error: ${error.response.data.detail || error.response.statusText}`);
      }
      
      throw error;
    }
  }

  /**
   * Get job status from CrewAI service
   */
  async getJobStatus(jobId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/jobs/${jobId}`,
        { timeout: this.requestTimeout }
      );

      return {
        success: true,
        jobId: jobId,
        status: response.data.status,
        progress: response.data.progress || 0,
        result: response.data.result,
        error: response.data.error
      };

    } catch (error) {
      console.error('❌ Error getting job status:', error.message);
      
      if (error.response && error.response.status === 404) {
        throw new Error('Job not found');
      }
      
      throw error;
    }
  }

  /**
   * Connect to CrewAI WebSocket for real-time updates
   */
  async connectWebSocket(sessionId) {
    if (this.wsConnections.has(sessionId)) {
      console.log('📡 WebSocket already connected for session:', sessionId);
      return;
    }

    try {
      const ws = new WebSocket(`${this.wsUrl}/ws/${sessionId}`);
      
      ws.on('open', () => {
        console.log('📡 WebSocket connected for session:', sessionId);
        this.wsConnections.set(sessionId, ws);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          console.log('📨 Received WebSocket message:', message);
          
          // Emit events for different message types
          this.emit('jobUpdate', message);
          this.emit(`jobUpdate:${sessionId}`, message);
          
          if (message.type === 'job_complete') {
            this.emit('jobComplete', message);
            this.emit(`jobComplete:${sessionId}`, message);
          } else if (message.type === 'job_error') {
            this.emit('jobError', message);
            this.emit(`jobError:${sessionId}`, message);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('📡 WebSocket disconnected for session:', sessionId);
        this.wsConnections.delete(sessionId);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error for session', sessionId, ':', error);
        this.wsConnections.delete(sessionId);
      });

    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
    }
  }

  /**
   * Disconnect WebSocket for a session
   */
  disconnectWebSocket(sessionId) {
    const ws = this.wsConnections.get(sessionId);
    if (ws) {
      ws.close();
      this.wsConnections.delete(sessionId);
      console.log('📡 WebSocket disconnected for session:', sessionId);
    }
  }

  /**
   * Format property data for CrewAI service
   */
  formatPropertyData(propertyData) {
    return {
      property_id: propertyData.propertyId || propertyData.id,
      address: propertyData.address,
      postcode: propertyData.postcode,
      property_type: propertyData.propertyType || 'house',
      price: parseFloat(propertyData.price),
      price_type: propertyData.priceType || 'fixed',
      tenure: propertyData.tenure || 'freehold',
      bedrooms: parseInt(propertyData.bedrooms) || 0,
      bathrooms: parseInt(propertyData.bathrooms) || 0,
      reception_rooms: parseInt(propertyData.receptionRooms) || 0,
      total_rooms: parseInt(propertyData.totalRooms) || 0,
      floor_area: parseFloat(propertyData.floorArea) || null,
      features: propertyData.features || [],
      garden: Boolean(propertyData.garden),
      parking: Boolean(propertyData.parking),
      balcony: Boolean(propertyData.balcony),
      fireplace: Boolean(propertyData.fireplace),
      epc_rating: propertyData.epcRating || 'D',
      council_tax_band: propertyData.councilTaxBand || 'C',
      location_features: propertyData.locationFeatures || [],
      transport_links: propertyData.transportLinks || [],
      images: propertyData.images || [],
      agent_name: propertyData.agentName || null,
      agent_phone: propertyData.agentPhone || null,
      agent_email: propertyData.agentEmail || null,
      market_notes: propertyData.marketNotes || null,
      selling_points: propertyData.sellingPoints || []
    };
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check for CrewAI service
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      
      return {
        healthy: true,
        service: response.data.service,
        status: response.data.status
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Get service capabilities
   */
  async getCapabilities() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/capabilities`, {
        timeout: this.requestTimeout
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting CrewAI capabilities:', error.message);
      return null;
    }
  }

  /**
   * Cleanup all WebSocket connections
   */
  cleanup() {
    console.log('🧹 Cleaning up CrewAI service connections...');
    
    for (const [sessionId, ws] of this.wsConnections) {
      ws.close();
    }
    
    this.wsConnections.clear();
    this.removeAllListeners();
  }
}

// Create singleton instance
const crewaiService = new CrewAIService();

module.exports = crewaiService;
 * CrewAI Service Integration
 * Handles communication with the CrewAI Python service
 */

const axios = require('axios');
const WebSocket = require('ws');
const EventEmitter = require('events');

class CrewAIService extends EventEmitter {
  constructor() {
    super();
    this.baseUrl = process.env.CREWAI_SERVICE_URL || 'http://localhost:8002';
    this.wsUrl = process.env.CREWAI_WS_URL || 'ws://localhost:8002';
    this.wsConnections = new Map(); // sessionId -> WebSocket
    this.requestTimeout = 30000; // 30 seconds
  }

  /**
   * Generate property marketing content using CrewAI
   */
  async generatePropertyContent(propertyData, platforms = ['facebook', 'instagram'], sessionId = null) {
    try {
      const requestData = {
        property_data: this.formatPropertyData(propertyData),
        platforms: platforms,
        user_id: propertyData.userId || 'anonymous',
        session_id: sessionId || this.generateSessionId()
      };

      console.log('🚀 Sending request to CrewAI service:', {
        property_id: propertyData.propertyId,
        platforms: platforms,
        session_id: requestData.session_id
      });

      const response = await axios.post(
        `${this.baseUrl}/api/v1/generate`,
        requestData,
        {
          timeout: this.requestTimeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.job_id) {
        console.log('✅ CrewAI job created:', response.data.job_id);
        
        // Set up WebSocket connection for real-time updates
        if (sessionId) {
          await this.connectWebSocket(requestData.session_id);
        }

        return {
          success: true,
          jobId: response.data.job_id,
          sessionId: requestData.session_id,
          status: 'queued'
        };
      } else {
        throw new Error('Invalid response from CrewAI service');
      }

    } catch (error) {
      console.error('❌ CrewAI service error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        throw new Error('CrewAI service is not available. Please check if the service is running.');
      }
      
      if (error.response) {
        throw new Error(`CrewAI service error: ${error.response.data.detail || error.response.statusText}`);
      }
      
      throw error;
    }
  }

  /**
   * Get job status from CrewAI service
   */
  async getJobStatus(jobId) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/jobs/${jobId}`,
        { timeout: this.requestTimeout }
      );

      return {
        success: true,
        jobId: jobId,
        status: response.data.status,
        progress: response.data.progress || 0,
        result: response.data.result,
        error: response.data.error
      };

    } catch (error) {
      console.error('❌ Error getting job status:', error.message);
      
      if (error.response && error.response.status === 404) {
        throw new Error('Job not found');
      }
      
      throw error;
    }
  }

  /**
   * Connect to CrewAI WebSocket for real-time updates
   */
  async connectWebSocket(sessionId) {
    if (this.wsConnections.has(sessionId)) {
      console.log('📡 WebSocket already connected for session:', sessionId);
      return;
    }

    try {
      const ws = new WebSocket(`${this.wsUrl}/ws/${sessionId}`);
      
      ws.on('open', () => {
        console.log('📡 WebSocket connected for session:', sessionId);
        this.wsConnections.set(sessionId, ws);
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          console.log('📨 Received WebSocket message:', message);
          
          // Emit events for different message types
          this.emit('jobUpdate', message);
          this.emit(`jobUpdate:${sessionId}`, message);
          
          if (message.type === 'job_complete') {
            this.emit('jobComplete', message);
            this.emit(`jobComplete:${sessionId}`, message);
          } else if (message.type === 'job_error') {
            this.emit('jobError', message);
            this.emit(`jobError:${sessionId}`, message);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        console.log('📡 WebSocket disconnected for session:', sessionId);
        this.wsConnections.delete(sessionId);
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error for session', sessionId, ':', error);
        this.wsConnections.delete(sessionId);
      });

    } catch (error) {
      console.error('❌ Error connecting to WebSocket:', error);
    }
  }

  /**
   * Disconnect WebSocket for a session
   */
  disconnectWebSocket(sessionId) {
    const ws = this.wsConnections.get(sessionId);
    if (ws) {
      ws.close();
      this.wsConnections.delete(sessionId);
      console.log('📡 WebSocket disconnected for session:', sessionId);
    }
  }

  /**
   * Format property data for CrewAI service
   */
  formatPropertyData(propertyData) {
    return {
      property_id: propertyData.propertyId || propertyData.id,
      address: propertyData.address,
      postcode: propertyData.postcode,
      property_type: propertyData.propertyType || 'house',
      price: parseFloat(propertyData.price),
      price_type: propertyData.priceType || 'fixed',
      tenure: propertyData.tenure || 'freehold',
      bedrooms: parseInt(propertyData.bedrooms) || 0,
      bathrooms: parseInt(propertyData.bathrooms) || 0,
      reception_rooms: parseInt(propertyData.receptionRooms) || 0,
      total_rooms: parseInt(propertyData.totalRooms) || 0,
      floor_area: parseFloat(propertyData.floorArea) || null,
      features: propertyData.features || [],
      garden: Boolean(propertyData.garden),
      parking: Boolean(propertyData.parking),
      balcony: Boolean(propertyData.balcony),
      fireplace: Boolean(propertyData.fireplace),
      epc_rating: propertyData.epcRating || 'D',
      council_tax_band: propertyData.councilTaxBand || 'C',
      location_features: propertyData.locationFeatures || [],
      transport_links: propertyData.transportLinks || [],
      images: propertyData.images || [],
      agent_name: propertyData.agentName || null,
      agent_phone: propertyData.agentPhone || null,
      agent_email: propertyData.agentEmail || null,
      market_notes: propertyData.marketNotes || null,
      selling_points: propertyData.sellingPoints || []
    };
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check for CrewAI service
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 5000
      });
      
      return {
        healthy: true,
        service: response.data.service,
        status: response.data.status
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * Get service capabilities
   */
  async getCapabilities() {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/capabilities`, {
        timeout: this.requestTimeout
      });
      
      return response.data;
    } catch (error) {
      console.error('❌ Error getting CrewAI capabilities:', error.message);
      return null;
    }
  }

  /**
   * Cleanup all WebSocket connections
   */
  cleanup() {
    console.log('🧹 Cleaning up CrewAI service connections...');
    
    for (const [sessionId, ws] of this.wsConnections) {
      ws.close();
    }
    
    this.wsConnections.clear();
    this.removeAllListeners();
  }
}

// Create singleton instance
const crewaiService = new CrewAIService();

module.exports = crewaiService;



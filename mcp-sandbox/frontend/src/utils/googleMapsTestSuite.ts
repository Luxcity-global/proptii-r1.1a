/**
 * Google Maps Test Suite
 * Comprehensive testing utilities for Google Maps integration
 */

import googleMapsLoader from './googleMapsLoader';
import geocodingService from '../services/geocodingService';

export interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

export interface TestSuite {
  suiteName: string;
  results: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
}

class GoogleMapsTestSuite {
  private results: TestResult[] = [];

  /**
   * Run a single test
   */
  private async runTest(
    testName: string,
    testFunction: () => Promise<boolean>,
    details?: any
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🧪 [TEST] Running: ${testName}`);
      const passed = await testFunction();
      const duration = Date.now() - startTime;
      
      const result: TestResult = {
        testName,
        passed,
        message: passed ? 'PASSED' : 'FAILED',
        duration,
        details
      };
      
      this.results.push(result);
      console.log(`${passed ? '✅' : '❌'} [TEST] ${testName}: ${passed ? 'PASSED' : 'FAILED'} (${duration}ms)`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        testName,
        passed: false,
        message: `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration,
        details
      };
      
      this.results.push(result);
      console.error(`❌ [TEST] ${testName}: ERROR (${duration}ms)`, error);
      
      return result;
    }
  }

  /**
   * Test 1: Google Maps API Loading
   */
  private async testApiLoading(): Promise<boolean> {
    await googleMapsLoader.loadGoogleMaps();
    return googleMapsLoader.isGoogleMapsLoaded();
  }

  /**
   * Test 2: Google Maps Instance Access
   */
  private async testMapsInstance(): Promise<boolean> {
    const maps = googleMapsLoader.getGoogleMaps();
    return !!(maps && maps.Map && maps.Marker && maps.InfoWindow);
  }

  /**
   * Test 3: Geocoding Service Initialization
   */
  private async testGeocodingInitialization(): Promise<boolean> {
    await geocodingService.initializeGeocoder();
    return true; // If no error thrown, initialization succeeded
  }

  /**
   * Test 4: Single Address Geocoding
   */
  private async testSingleGeocoding(): Promise<boolean> {
    const testAddress = '10 Downing Street, London, UK';
    const result = await geocodingService.geocodeAddress(testAddress);
    
    if (!result) return false;
    
    // Validate result structure
    return !!(
      result.lat &&
      result.lng &&
      result.formattedAddress &&
      result.confidence > 0 &&
      result.confidence <= 1
    );
  }

  /**
   * Test 5: Batch Geocoding
   */
  private async testBatchGeocoding(): Promise<boolean> {
    const testAddresses = [
      'Big Ben, London, UK',
      'Tower Bridge, London, UK',
      'Hyde Park, London, UK'
    ];
    
    const results = await geocodingService.geocodeAddresses(testAddresses);
    
    // Should have at least 2 successful results
    return results.size >= 2;
  }

  /**
   * Test 6: Geocoding Cache
   */
  private async testGeocodingCache(): Promise<boolean> {
    const testAddress = 'Buckingham Palace, London, UK';
    
    // First geocoding (should cache)
    const result1 = await geocodingService.geocodeAddress(testAddress);
    if (!result1) return false;
    
    // Second geocoding (should use cache)
    const result2 = await geocodingService.geocodeAddress(testAddress);
    if (!result2) return false;
    
    // Results should be identical
    return (
      result1.lat === result2.lat &&
      result1.lng === result2.lng &&
      result1.formattedAddress === result2.formattedAddress
    );
  }

  /**
   * Test 7: Invalid Address Handling
   */
  private async testInvalidAddressHandling(): Promise<boolean> {
    const invalidAddress = 'ThisIsNotARealAddress12345XYZ';
    const result = await geocodingService.geocodeAddress(invalidAddress);
    
    // Should return null for invalid addresses
    return result === null;
  }

  /**
   * Test 8: Map Creation
   */
  private async testMapCreation(): Promise<boolean> {
    const maps = googleMapsLoader.getGoogleMaps();
    if (!maps) return false;
    
    // Create a test map element
    const testElement = document.createElement('div');
    testElement.style.width = '100px';
    testElement.style.height = '100px';
    document.body.appendChild(testElement);
    
    try {
      const map = new maps.Map(testElement, {
        center: { lat: 51.5074, lng: -0.1278 },
        zoom: 10
      });
      
      // Clean up
      document.body.removeChild(testElement);
      
      return !!(map && map.getCenter);
    } catch (error) {
      // Clean up on error
      if (document.body.contains(testElement)) {
        document.body.removeChild(testElement);
      }
      return false;
    }
  }

  /**
   * Test 9: Marker Creation
   */
  private async testMarkerCreation(): Promise<boolean> {
    const maps = googleMapsLoader.getGoogleMaps();
    if (!maps) return false;
    
    try {
      const marker = new maps.Marker({
        position: { lat: 51.5074, lng: -0.1278 },
        title: 'Test Marker'
      });
      
      return !!(marker && marker.getPosition);
    } catch (error) {
      return false;
    }
  }

  /**
   * Test 10: InfoWindow Creation
   */
  private async testInfoWindowCreation(): Promise<boolean> {
    const maps = googleMapsLoader.getGoogleMaps();
    if (!maps) return false;
    
    try {
      const infoWindow = new maps.InfoWindow({
        content: 'Test Info Window'
      });
      
      return !!(infoWindow && infoWindow.setContent);
    } catch (error) {
      return false;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestSuite> {
    console.log('🚀 [TEST-SUITE] Starting Google Maps Test Suite...');
    this.results = [];
    
    const startTime = Date.now();
    
    // Run all tests
    await this.runTest('API Loading', () => this.testApiLoading());
    await this.runTest('Maps Instance Access', () => this.testMapsInstance());
    await this.runTest('Geocoding Initialization', () => this.testGeocodingInitialization());
    await this.runTest('Single Address Geocoding', () => this.testSingleGeocoding());
    await this.runTest('Batch Geocoding', () => this.testBatchGeocoding());
    await this.runTest('Geocoding Cache', () => this.testGeocodingCache());
    await this.runTest('Invalid Address Handling', () => this.testInvalidAddressHandling());
    await this.runTest('Map Creation', () => this.testMapCreation());
    await this.runTest('Marker Creation', () => this.testMarkerCreation());
    await this.runTest('InfoWindow Creation', () => this.testInfoWindowCreation());
    
    const totalDuration = Date.now() - startTime;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = this.results.filter(r => !r.passed).length;
    
    const suite: TestSuite = {
      suiteName: 'Google Maps Integration Test Suite',
      results: this.results,
      totalTests: this.results.length,
      passedTests,
      failedTests,
      totalDuration
    };
    
    console.log(`🏁 [TEST-SUITE] Completed: ${passedTests}/${this.results.length} tests passed (${totalDuration}ms)`);
    
    return suite;
  }

  /**
   * Get test results summary
   */
  getResultsSummary(): string {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = Math.round((passed / total) * 100);
    
    return `${passed}/${total} tests passed (${percentage}%)`;
  }

  /**
   * Get detailed results
   */
  getDetailedResults(): TestResult[] {
    return [...this.results];
  }
}

export default new GoogleMapsTestSuite();

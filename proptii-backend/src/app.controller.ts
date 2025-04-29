import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { db } from './config/firebase.config';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {
    console.log('AppController initialized');
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    console.log('Health check endpoint called');
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'proptii-backend',
      version: '1.0.0'
    };
  }

  @Get('test-firebase')
  async testFirebase() {
    console.log('Test Firebase endpoint called');
    try {
      console.log('Attempting to write to test collection...');
      
      const testData = {
        timestamp: new Date(),
        status: 'success',
        environment: process.env.NODE_ENV || 'development'
      };
      
      console.log('Test data:', testData);
      
      const testDoc = await db.collection('test').doc('connection').set(testData);
      console.log('Successfully wrote to Firestore:', testDoc);
      
      const readDoc = await db.collection('test').doc('connection').get();
      console.log('Read document data:', readDoc.data());
      
      return { 
        success: true, 
        message: 'Firebase connection successful',
        writeResult: testDoc,
        readData: readDoc.data()
      };
    } catch (error) {
      console.error('Firebase connection error:', error);
      console.error('Error stack:', error.stack);
      return { 
        success: false, 
        error: error.message,
        stack: error.stack,
        errorCode: error.code
      };
    }
  }
}
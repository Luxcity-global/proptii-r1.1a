import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { NestFactory } from '@nestjs/core';
import { INestApplication, BadRequestException, ForbiddenException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const distPath = path.resolve(__dirname, '../../dist/app.module.js');
if (!fs.existsSync(distPath)) {
  execSync('npm run build', { cwd: path.resolve(__dirname, '../..'), stdio: 'pipe' });
}

// Import compiled modules where TypeScript decorator metadata is preserved
const { AppModule } = require('../../dist/app.module');
const { HealthController } = require('../../dist/controllers/health.controller');
const { AuthController } = require('../../dist/controllers/auth.controller');
const { PropertyFactsController } = require('../../dist/controllers/property-facts.controller');
const { ClassifierController } = require('../../dist/search/classifier.controller');
const { StorageController } = require('../../dist/controllers/storage.controller');

describe('End-to-End API & Swagger Documentation Verification', () => {
  let app: INestApplication;
  let swaggerDoc: any;

  beforeAll(async () => {
    app = await NestFactory.create(AppModule, { logger: false });
    app.setGlobalPrefix('api');

    const config = new DocumentBuilder()
      .setTitle('Proptii API')
      .setDescription('Consolidated Proptii v2 Backend API')
      .setVersion('1.4')
      .addBearerAuth()
      .addTag('Health')
      .addTag('Auth')
      .addTag('Users')
      .addTag('Properties')
      .addTag('Saved Properties')
      .addTag('Viewing Requests')
      .addTag('Referencing')
      .addTag('Contracts')
      .addTag('Communication')
      .addTag('Admin Dashboard')
      .addTag('Billing')
      .addTag('Storage')
      .addTag('Search & AI')
      .addTag('Property Facts')
      .addTag('Runtime Flags')
      .build();

    swaggerDoc = SwaggerModule.createDocument(app, config);
  });

  describe('OpenAPI 3.0 Swagger Specification Generation', () => {
    it('generates a valid OpenAPI spec with expected metadata and title', () => {
      expect(swaggerDoc).toBeDefined();
      expect(swaggerDoc.openapi).toMatch(/^3\./);
      expect(swaggerDoc.info.title).toBe('Proptii API');
      expect(swaggerDoc.info.version).toBe('1.4');
    });

    it('contains all functional domain tags', () => {
      const tagNames = swaggerDoc.tags.map((t: any) => t.name);
      expect(tagNames).toContain('Health');
      expect(tagNames).toContain('Auth');
      expect(tagNames).toContain('Users');
      expect(tagNames).toContain('Properties');
      expect(tagNames).toContain('Saved Properties');
      expect(tagNames).toContain('Viewing Requests');
      expect(tagNames).toContain('Referencing');
      expect(tagNames).toContain('Contracts');
      expect(tagNames).toContain('Communication');
      expect(tagNames).toContain('Admin Dashboard');
      expect(tagNames).toContain('Billing');
      expect(tagNames).toContain('Storage');
      expect(tagNames).toContain('Search & AI');
      expect(tagNames).toContain('Property Facts');
      expect(tagNames).toContain('Runtime Flags');
    });

    it('documents all critical API endpoint paths in the OpenAPI schema', () => {
      const paths = Object.keys(swaggerDoc.paths);

      // Verify essential paths exist in Swagger
      const expectedPaths = [
        '/api/health',
        '/api/auth/me',
        '/api/auth/role',
        '/api/users/profile',
        '/api/users/{id}',
        '/api/contracts',
        '/api/contracts/send-signed-contract',
        '/api/viewing-requests',
        '/api/viewing-requests/{id}',
        '/api/referencing/identity',
        '/api/referencing/employment',
        '/api/referencing/forms/all',
        '/api/referencing/forms/{formId}',
        '/api/admin/customers',
        '/api/admin/overview',
        '/api/search/classify',
        '/api/properties/facts',
        '/api/properties/{listingId}/facts',
        '/api/billing/checkout',
        '/api/billing/plans',
        '/api/storage/upload',
        '/api/storage/file',
        '/api/flags',
      ];

      for (const expected of expectedPaths) {
        expect(paths).toContain(expected);
      }
    });

    it('properly marks multipart/form-data for file uploads in Swagger spec', () => {
      // Contract send signed contract
      const contractSendOp = swaggerDoc.paths['/api/contracts/send-signed-contract']?.post;
      expect(contractSendOp).toBeDefined();
      expect(contractSendOp.requestBody.content['multipart/form-data']).toBeDefined();

      // Storage upload
      const storageUploadOp = swaggerDoc.paths['/api/storage/upload']?.post;
      expect(storageUploadOp).toBeDefined();
      expect(storageUploadOp.requestBody.content['multipart/form-data']).toBeDefined();
    });

    it('documents query and body schemas correctly', () => {
      // Search classify body schema
      const classifyOp = swaggerDoc.paths['/api/search/classify']?.post;
      expect(classifyOp).toBeDefined();
      expect(classifyOp.summary).toContain('Classify free-text search query');

      // Admin customer ID param
      const getCustomerOp = swaggerDoc.paths['/api/admin/customers/{id}']?.get;
      expect(getCustomerOp).toBeDefined();
      const idParam = getCustomerOp.parameters.find((p: any) => p.name === 'id');
      expect(idParam).toBeDefined();
      expect(idParam.in).toBe('path');
    });
  });

  describe('End-to-End Controller Runtime Logic Verification', () => {
    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('HealthController returns service status', () => {
      const healthController = app.get(HealthController);
      const res = healthController.checkHealth();
      expect(res.status).toBe('ok');
      expect(res.service).toBe('proptii-v2-backend');
      expect(res.timestamp).toBeDefined();
    });

    it('AuthController rejects invalid role update', async () => {
      const authController = app.get(AuthController);
      const req = { user: { uid: 'user_1', email: 'test@example.com' } };

      await expect(
        authController.updateRole(req, { role: 'superadmin' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('AuthController prevents tenants from switching to landlord or agent', async () => {
      const authController = app.get(AuthController);
      const req = { user: { uid: 'user_1', email: 'test@example.com', role: 'tenant' } };

      await expect(
        authController.updateRole(req, { role: 'landlord' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('PropertyFactsController returns empty map when no listing IDs or UPRNs provided', async () => {
      const factsController = app.get(PropertyFactsController);
      const res = await factsController.getBatchFacts({});
      expect(res).toEqual({});
    });

    it('ClassifierController classifies query', async () => {
      const classifierController = app.get(ClassifierController);
      const res = await classifierController.classify({ query: '2 bed flat shoreditch' });
      expect(res).toBeDefined();
      expect(res.intent).toBeDefined();
    });

    it('StorageController rejects missing file upload', async () => {
      const storageController = app.get(StorageController);
      const req = { user: { uid: 'user_1' } };
      await expect(
        storageController.uploadFile(req, null as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

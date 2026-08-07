import { Controller, Get, Logger, Query, HttpException, HttpStatus, Header } from '@nestjs/common';
import axios from 'axios';
import { AppService } from './app.service';
import { NativePropertiesService } from './services/native-properties.service';
import type { NativeProperty } from './schemas/native-property.schema';

/**
 * Inline normaliser — mirrors the one in native-properties.controller.ts.
 * Maps the NativeProperty Mongoose document to the frontend Property shape.
 */
function normaliseForSearch(p: NativeProperty & { _doc?: any }): Record<string, any> {
  const doc = p._doc ?? p;
  const locationParts = [doc.address, doc.city, doc.postcode].filter(Boolean);
  const location = locationParts.join(', ') || doc.title || 'Location not specified';
  const imageUrls: string[] = Array.isArray(doc.photos)
    ? doc.photos.map((ph: any) => ph?.url).filter(Boolean)
    : [];
  return {
    id: doc.id,
    source: 'native',
    landlordId: doc.landlordId || doc.userId,
    title: doc.title,
    price: doc.price ?? '',
    location,
    bedrooms: doc.bedrooms ?? 0,
    bathrooms: doc.bathrooms ?? undefined,
    propertyType: doc.propertyType || doc.type || 'Property',
    description: doc.notes ?? '',
    squareFootage: doc.squareFootage ? String(doc.squareFootage) : undefined,
    amenities: Array.isArray(doc.amenities) ? doc.amenities : [],
    imageUrls,
    agent: {
      id: doc.landlordId || doc.userId,
      name: doc.agentName || 'Proptii Landlord',
      email: doc.ownerEmail || '',
      phone: doc.contactPhone ?? undefined,
      company: doc.agentCompany ?? undefined,
    },
    street: doc.address,
    city: doc.city,
    postcode: doc.postcode,
    status: doc.status,
  };
}

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly appService: AppService,
    private readonly nativePropertiesService: NativePropertiesService,
  ) {
    this.logger.log('AppController initialized');
  }

  @Get()
  getRoot() {
    return {
      name: 'Proptii Backend API',
      version: '1.0.0',
      status: 'running',
      timestamp: new Date().toISOString(),
      docs: '/api-docs',
      healthCheck: '/api/health',
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'proptii-backend',
      version: '1.0.0',
      uptime: process.uptime(),
    };
  }

  /**
   * GET /api/properties/search?q=<query>&limit=<n>
   *
   * Public alias for native-properties full-text search.
   * This is the exact URL called by useSearchBackend.ts in the frontend:
   *   `${apiBase}/properties/search?q=...&limit=50`
   *
   * Delegates to NativePropertiesService.searchPublic() which:
   *  - Uses the MongoDB $text index on title/address/city/notes (fast)
   *  - Falls back to regex if the index isn't ready
   *  - Only returns properties with status='vacant'
   */
  @Get('properties/search')
  async propertiesSearch(
    @Query('q') q = '',
    @Query('limit') limit = '50',
  ) {
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const results = await this.nativePropertiesService.searchPublic(q, limitNum);
    return { results: results.map(normaliseForSearch), total: results.length, query: q };
  }

  @Get('govuk-rss')
  @Header('Content-Type', 'application/xml')
  async getGovUkRss() {
    try {
      this.logger.log('Fetching GOV.UK RSS Atom feed...');
      const response = await axios.get('https://www.gov.uk/search/news-and-communications.atom', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Proptii Market Insights Bot)',
        },
        timeout: 10000,
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(`Failed to fetch GOV.UK RSS feed: ${error.message}`);
      throw new HttpException(
        `Failed to fetch GOV.UK RSS feed: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
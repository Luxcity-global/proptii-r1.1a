import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { NativePropertiesService } from '../services/native-properties.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import type { NativeProperty } from '../schemas/native-property.schema';

/**
 * Normalises a NativeProperty document to the shape the frontend Property
 * interface expects (src/types/property.ts). Without this, hosted landlord
 * properties render with blank images, no location, and no agent info.
 *
 * Mapping:
 *   NativeProperty.address + city + postcode → Property.location
 *   NativeProperty.photos[].url             → Property.imageUrls[]
 *   NativeProperty.type / propertyType      → Property.propertyType
 *   NativeProperty.ownerEmail               → Property.agent.email
 *   NativeProperty.landlordId               → Property.landlordId
 */
function normaliseForSearch(p: NativeProperty & { _doc?: any }): Record<string, any> {
  // Mongoose documents wrap data in _doc — plain-ify first.
  const doc = p._doc ?? p;

  const locationParts = [doc.address, doc.city, doc.postcode].filter(Boolean);
  const location = locationParts.join(', ') || doc.title || 'Location not specified';

  const imageUrls: string[] = Array.isArray(doc.photos)
    ? doc.photos.map((ph: any) => ph?.url).filter(Boolean)
    : [];

  const propertyType = doc.propertyType || doc.type || 'Property';

  return {
    // Identity
    id: doc.id,
    source: 'native',
    landlordId: doc.landlordId || doc.userId,
    // Display fields
    title: doc.title,
    price: doc.price ?? '',
    location,
    bedrooms: doc.bedrooms ?? 0,
    bathrooms: doc.bathrooms ?? undefined,
    propertyType,
    description: doc.notes ?? '',
    squareFootage: doc.squareFootage ? String(doc.squareFootage) : undefined,
    amenities: Array.isArray(doc.amenities) ? doc.amenities : [],
    // Images
    imageUrls,
    // Agent / contact — native properties use ownerEmail as the contact.
    // This lets tenants message the landlord through the platform.
    agent: {
      id: doc.landlordId || doc.userId,
      name: doc.agentName || 'Proptii Landlord',
      email: doc.ownerEmail || '',
      phone: doc.contactPhone ?? undefined,
      company: doc.agentCompany ?? undefined,
    },
    // Address components for detail view
    street: doc.address,
    city: doc.city,
    postcode: doc.postcode,
    // Status
    status: doc.status,
  };
}

@Controller('native-properties')
export class NativePropertiesController {
  constructor(private readonly propertiesService: NativePropertiesService) {}

  /**
   * Public property search — no authentication required.
   * Used by the tenant search flow (useSearchBackend.ts → GET /api/native-properties/search).
   *
   * Also aliased by the app controller at GET /api/properties/search
   * (that is the URL literally called in useSearchBackend.ts line 112).
   */
  @Get('search')
  async search(
    @Query('q') q = '',
    @Query('status') status = 'vacant',
    @Query('limit') limit = '50',
  ) {
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    const results = await this.propertiesService.searchPublic(q, limitNum);
    return { results: results.map(normaliseForSearch), total: results.length, query: q };
  }

  @Get()
  async list(@Query('userId') userId?: string, @Query('email') email?: string) {
    return await this.propertiesService.findAllByUser(userId, email);
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    const property = await this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  @ApiBearerAuth()
  async create(@Req() req: any) {
    const body = req.body;
    const email = req.user?.emails?.[0] || req.user?.email || req.user?.preferred_username || '';
    const userId = req.user?.sub;
    return await this.propertiesService.create({
      ...body,
      userId: userId,
      ownerEmail: email.toLowerCase().trim(),
      landlordId: userId,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  @ApiBearerAuth()
  async update(@Req() req: any, @Param('id') id: string) {
    const body = req.body;
    const userId = req.user?.sub;
    return await this.propertiesService.update(id, userId, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  @ApiBearerAuth()
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub;
    await this.propertiesService.remove(id, userId);
    return { message: 'Property deleted' };
  }
}

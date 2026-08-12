import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { NativePropertiesService } from '../services/native-properties.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

function normaliseForSearch(doc: any): Record<string, any> {
  const locationParts = [doc.address, doc.city, doc.postcode].filter(Boolean);
  const location = locationParts.join(', ') || doc.title || 'Location not specified';

  const imageUrls: string[] = Array.isArray(doc.photos)
    ? doc.photos.map((ph: any) => typeof ph === 'string' ? ph : ph?.url).filter(Boolean)
    : [];

  const propertyType = doc.propertyType || doc.type || 'Property';

  return {
    id: doc.id,
    source: 'native',
    landlordId: doc.landlordId || doc.userId,
    title: doc.title,
    price: doc.price ?? '',
    location,
    bedrooms: doc.bedrooms ?? 0,
    bathrooms: doc.bathrooms ?? undefined,
    propertyType,
    description: doc.notes ?? doc.description ?? '',
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
    status: doc.status || 'vacant',
  };
}

@Controller(['native-properties', 'properties'])
export class NativePropertiesController {
  constructor(private readonly propertiesService: NativePropertiesService) {}

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
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  async create(@Req() req: any, @Body() body: any) {
    const email = req.user?.email || '';
    const userId = req.user?.uid;
    return await this.propertiesService.create({
      ...body,
      userId,
      ownerEmail: email.toLowerCase().trim(),
      landlordId: userId,
    });
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const userId = req.user?.uid;
    return await this.propertiesService.update(id, userId, body);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent')
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.uid;
    await this.propertiesService.remove(id, userId);
    return { message: 'Property deleted' };
  }
}

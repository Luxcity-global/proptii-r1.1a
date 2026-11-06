import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NativePropertiesService } from '../services/native-properties.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CreatePropertyDto, UpdatePropertyDto } from '../dto/property.dto';

function normaliseForSearch(doc: any): Record<string, any> {
  const locationParts = [doc.address, doc.city, doc.postcode].filter(Boolean);
  const location = locationParts.join(', ') || doc.title || 'Location not specified';

  const imageUrls: string[] = Array.isArray(doc.photos)
    ? doc.photos.map((ph: any) => typeof ph === 'string' ? ph : ph?.url).filter(Boolean)
    : [];

  const propertyType = doc.propertyType || doc.type || 'Property';

  const createdAt = doc.createdAt?.toDate ? doc.createdAt.toDate().toISOString() : (typeof doc.createdAt === 'string' ? doc.createdAt : undefined);
  const updatedAt = doc.updatedAt?.toDate ? doc.updatedAt.toDate().toISOString() : (typeof doc.updatedAt === 'string' ? doc.updatedAt : undefined);

  let addedOrReduced: string | undefined = undefined;
  let modifiedReason: string | undefined = undefined;
  let modifiedOn: string | undefined = undefined;

  if (createdAt) {
    addedOrReduced = `Added ${new Date(createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }

  if (updatedAt && createdAt) {
    const diffMs = Math.abs(new Date(updatedAt).getTime() - new Date(createdAt).getTime());
    if (diffMs > 60000) {
      modifiedOn = updatedAt;
      modifiedReason = 'Listing updated';
      addedOrReduced = `Updated ${new Date(updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    }
  }

  return {
    id: doc.id,
    source: 'native',
    landlordId: doc.landlordId || doc.userId,
    title: doc.title,
    price: doc.price ?? '',
    location,
    bedrooms: (doc.bedrooms !== undefined && doc.bedrooms !== null && doc.bedrooms !== '') ? Number(doc.bedrooms) : undefined,
    bathrooms: (doc.bathrooms ?? doc.bathroom_count ?? doc.bathroomCount) !== undefined ? Number(doc.bathrooms ?? doc.bathroom_count ?? doc.bathroomCount) : undefined,
    bathroom_count: (doc.bathrooms ?? doc.bathroom_count ?? doc.bathroomCount) !== undefined ? Number(doc.bathrooms ?? doc.bathroom_count ?? doc.bathroomCount) : undefined,
    propertyType,
    description: doc.notes ?? doc.description ?? '',
    squareFootage: (doc.squareFootage ?? doc.sq_ft ?? doc.sqft ?? doc.square_footage) ? String(doc.squareFootage ?? doc.sq_ft ?? doc.sqft ?? doc.square_footage) : undefined,
    sq_ft: (doc.squareFootage ?? doc.sq_ft ?? doc.sqft ?? doc.square_footage) ? Number(String(doc.squareFootage ?? doc.sq_ft ?? doc.sqft ?? doc.square_footage).replace(/[^0-9]/g, '')) : undefined,
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
    createdAt,
    updatedAt,
    publishedOn: createdAt,
    modifiedOn,
    modifiedReason,
    addedOrReduced,
  };
}

@ApiTags('Properties')
@Controller(['native-properties', 'properties'])
export class NativePropertiesController {
  constructor(private readonly propertiesService: NativePropertiesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Public property search across native catalog with cursor pagination' })
  @ApiQuery({ name: 'q', required: false, description: 'Search term/location' })
  @ApiQuery({ name: 'status', required: false, schema: { default: 'vacant' } })
  @ApiQuery({ name: 'limit', required: false, schema: { default: '50' } })
  @ApiQuery({ name: 'cursor', required: false, description: 'Cursor document ID for pagination' })
  @ApiResponse({ status: 200, description: 'Matched normalized properties' })
  async search(
    @Query('q') q = '',
    @Query('status') status = 'vacant',
    @Query('limit') limit = '50',
    @Query('cursor') cursor?: string,
  ) {
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);
    if (typeof this.propertiesService.searchPublicPaginated === 'function') {
      const { results, nextCursor, total } = await this.propertiesService.searchPublicPaginated({
        query: q,
        status,
        limit: limitNum,
        cursor,
      });
      return { results: results.map(normaliseForSearch), total, nextCursor, query: q };
    }
    const results = await this.propertiesService.searchPublic(q, limitNum);
    return { results: results.map(normaliseForSearch), total: results.length, query: q };
  }

  @Get()
  @ApiOperation({ summary: 'List native properties by landlord/agent user ID or email' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'email', required: false })
  @ApiResponse({ status: 200, description: 'List of properties' })
  async list(@Query('userId') userId?: string, @Query('email') email?: string) {
    return await this.propertiesService.findAllByUser(userId, email);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single native property by ID' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property details' })
  @ApiResponse({ status: 404, description: 'Property not found' })
  async getById(@Param('id') id: string) {
    const property = await this.propertiesService.findById(id);
    if (!property) {
      throw new NotFoundException('Property not found');
    }
    return property;
  }

  @Post()
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent', 'homeowner')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Create new native property listing (landlord, agent, homeowner)' })
  @ApiResponse({ status: 201, description: 'Property created' })
  @ApiResponse({ status: 400, description: 'Validation failed on required fields' })
  @ApiResponse({ status: 403, description: 'Forbidden if not landlord, agent, or homeowner' })
  async create(@Req() req: any, @Body() body: CreatePropertyDto) {
    const email = req.user?.email || '';
    const userId = req.user?.uid;
    return await this.propertiesService.create({
      ...body,
      userId,
      ownerEmail: email.toLowerCase().trim(),
      landlordId: userId,
    });
  }

  /**
   * POST /api/native-properties/bulk
   * Import up to 500 properties. Continues on individual failures — never stops early.
   * Returns { total, succeeded, failed, results[] } with per-row status.
   */
  @Post('bulk')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent', 'homeowner')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Bulk import up to 500 properties — continues and reports all errors' })
  @ApiResponse({ status: 200, description: 'Bulk import result with per-row success/failure detail' })
  async bulkCreate(@Req() req: any, @Body() body: { properties: any[] }) {
    const email = (req.user?.email || '').toLowerCase().trim();
    const userId = req.user?.uid;
    const rows: any[] = Array.isArray(body?.properties) ? body.properties : [];

    const results: { index: number; success: boolean; id?: string; error?: string }[] = [];
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        const result = await this.propertiesService.create({
          ...rows[i],
          userId,
          ownerEmail: email,
          landlordId: userId,
        });
        results.push({ index: i, success: true, id: (result as any)?.id || (result as any)?._id });
        succeeded++;
      } catch (err: any) {
        results.push({ index: i, success: false, error: err?.message || 'Unknown error' });
        failed++;
      }
      // 50ms delay between writes to avoid Firestore rate-limiting
      if (i < rows.length - 1) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    return { total: rows.length, succeeded, failed, results };
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent', 'homeowner')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update native property listing' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property updated' })
  @ApiResponse({ status: 400, description: 'Validation failed on update payload' })
  async update(@Req() req: any, @Param('id') id: string, @Body() body: UpdatePropertyDto) {
    const userId = req.user?.uid;
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    return await this.propertiesService.update(id, userId, userEmail, body);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent', 'homeowner')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete native property listing' })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiResponse({ status: 200, description: 'Property deleted' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.uid;
    const userEmail = (req.user?.email || '').toLowerCase().trim();
    await this.propertiesService.remove(id, userId, userEmail);
    return { message: 'Property deleted' };
  }
}

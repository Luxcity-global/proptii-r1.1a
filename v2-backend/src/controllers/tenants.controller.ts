import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { TenantsService } from '../services/tenants.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { CreateTenantDto } from '../dto/create-tenant.dto';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new tenant under landlord/agent management' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error — required fields missing or invalid' })
  async createTenant(@Req() req: any, @Body() body: CreateTenantDto) {
    const userId = req.user?.uid || req.user?.id || req.user?.email || (body as any).userId;
    return this.tenantsService.createTenant(body, userId);
  }

  /**
   * POST /api/tenants/bulk
   * Import up to 500 tenants at once. Continues on individual failures — never stops early.
   * Returns { total, succeeded, failed, results[] } with per-row status.
   */
  @Post('bulk')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bulk import up to 500 tenants — continues and reports all errors' })
  @ApiResponse({ status: 200, description: 'Bulk import result with per-row success/failure detail' })
  async bulkCreateTenants(@Req() req: any, @Body() body: { tenants: any[] }) {
    const userId = req.user?.uid || req.user?.id || req.user?.email;
    const rows: any[] = Array.isArray(body?.tenants) ? body.tenants : [];

    const results: { index: number; success: boolean; id?: string; error?: string }[] = [];
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      try {
        const result = await this.tenantsService.createTenant(rows[i], userId);
        results.push({ index: i, success: true, id: result.id });
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

  /**
   * POST /api/tenants/bulk-assign
   * Assign multiple tenants to properties. Continues on individual failures.
   */
  @Post('bulk-assign')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(200)
  @ApiOperation({ summary: 'Bulk assign tenants to properties — continues and reports all errors' })
  @ApiResponse({ status: 200, description: 'Bulk assignment result with per-row success/failure detail' })
  async bulkAssignTenants(@Req() req: any, @Body() body: { assignments: any[] }) {
    const rows: any[] = Array.isArray(body?.assignments) ? body.assignments : [];

    const results: { index: number; tenantId: string; success: boolean; error?: string }[] = [];
    let succeeded = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i++) {
      const { tenantId, propertyId, rentAmount, leaseStart, leaseEnd,
              firstPaymentDate, paymentFrequency } = rows[i];
      try {
        // Update tenant with new property assignment
        await this.tenantsService.updateTenant(tenantId, {
          propertyId,
          rentAmount,
          leaseStart,
          leaseEnd,
          firstPaymentDate: firstPaymentDate || leaseStart,
          paymentFrequency: paymentFrequency || 'monthly',
          status: 'active',
        });

        // Mark property as occupied (best-effort — failure here doesn't block the assignment)
        const db = (this.tenantsService as any).db;
        if (db && propertyId) {
          try {
            await db.collection('properties').doc(propertyId).set(
              {
                status: 'occupied',
                tenantId,
                updatedAt: require('firebase-admin').firestore.FieldValue.serverTimestamp(),
              },
              { merge: true },
            );
          } catch { /* best-effort */ }
        }

        results.push({ index: i, tenantId, success: true });
        succeeded++;
      } catch (err: any) {
        results.push({ index: i, tenantId, success: false, error: err?.message || 'Unknown error' });
        failed++;
      }
      if (i < rows.length - 1) {
        await new Promise(r => setTimeout(r, 50));
      }
    }

    return { total: rows.length, succeeded, failed, results };
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'List all tenants for authenticated landlord or owned property IDs' })
  @ApiQuery({ name: 'ownedPropertyIds', required: false, description: 'Comma-separated property IDs' })
  @ApiQuery({ name: 'userId', required: false, description: 'Optional userId override (used for email-keyed tenants)' })
  @ApiResponse({ status: 200, description: 'Array of tenants' })
  async getTenants(
    @Req() req: any,
    @Query('ownedPropertyIds') ownedPropertyIds?: string,
    @Query('userId') queryUserId?: string,
  ) {
    // Primary userId from JWT; fallback to query param for email-keyed tenants
    const jwtUserId = req.user?.uid || req.user?.id || req.user?.email;
    const userEmail = req.user?.email;
    const propIds = ownedPropertyIds ? ownedPropertyIds.split(',').filter(Boolean) : undefined;

    // Collect all identities to query by — JWT uid, JWT email, and any extra userId from query
    const extraUserId = queryUserId && queryUserId !== jwtUserId ? queryUserId : undefined;

    return this.tenantsService.getTenants(jwtUserId, propIds, userEmail, extraUserId);
  }

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get single tenant details by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Tenant object' })
  async getTenant(@Param('id') id: string) {
    return this.tenantsService.getTenant(id);
  }

  @Put(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update tenant details by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Update status' })
  async updateTenant(@Param('id') id: string, @Body() updates: any) {
    return this.tenantsService.updateTenant(id, updates);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete or archive tenant by ID' })
  @ApiParam({ name: 'id', description: 'Tenant ID' })
  @ApiResponse({ status: 200, description: 'Delete status' })
  async deleteTenant(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(id);
  }
}

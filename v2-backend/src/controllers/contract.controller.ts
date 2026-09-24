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
  Sse,
  MessageEvent,
  Logger,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { ContractService } from '../services/contract.service';
import { EventsService } from '../services/events.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

export interface MulterUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@ApiTags('Contracts')
@ApiBearerAuth('bearer')
@Controller('contracts')
export class ContractController {
  private readonly logger = new Logger(ContractController.name);

  constructor(
    private readonly contractService: ContractService,
    private readonly eventsService: EventsService,
  ) {}

  @Sse('events')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Subscribe to real-time contract event stream (SSE)' })
  sendContractEvents(@Req() req: any): Observable<MessageEvent> {
    const userId = req.user.uid;
    const email = req.user.email;
    const role = req.user.role;
    this.logger.log(`[SSE:Contracts] Client connected uid=${userId} email=${email}`);
    return this.eventsService.subscribe(userId, email, role);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'List contracts for authenticated user email' })
  @ApiResponse({ status: 200, description: 'Array of contract documents' })
  async getContracts(@Req() req: any) {
    const email = req.user.email || '';
    return await this.contractService.getContracts(email);
  }

  @Post()
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Save signed contract record' })
  @ApiResponse({ status: 201, description: 'Contract saved' })
  async saveSignedContract(@Req() req: any, @Body() body: any) {
    const userId = req.user?.uid || req.user?.id || req.user?.email || 'unknown';
    const result = await this.contractService.saveSignedContract(body, userId);
    this.eventsService.emit({
      type: 'contract_sent',
      userId,
      targetEmail: body.tenantEmail || body.recipientEmail,
      data: { contractId: result.id, title: body.title || body.contractName },
    });
    return result;
  }

  @Post('templates')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Save contract template' })
  @ApiResponse({ status: 201, description: 'Template created or updated' })
  async saveContractTemplate(@Req() req: any, @Body() body: any) {
    const userId = req.user.uid;
    const result = await this.contractService.saveTemplate(userId, body);
    this.eventsService.emit({
      type: 'contract_template_updated',
      userId,
      data: { action: 'saved', templateId: (result as any)?.id || (result as any)?.templateId },
    });
    return result;
  }

  @Get('templates')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get contract templates for landlord/agent' })
  @ApiQuery({ name: 'status', required: false, schema: { default: 'active' } })
  @ApiResponse({ status: 200, description: 'List of templates' })
  async getContractTemplates(@Req() req: any, @Query('status') status = 'active') {
    const userId = req.user.uid;
    return await this.contractService.getTemplates(userId, status);
  }

  @Put('templates/:id/status')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Update contract template status' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template status updated' })
  async updateContractTemplateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    const userId = req.user.uid;
    const result = await this.contractService.updateTemplateStatus(id, userId, body.status);
    this.eventsService.emit({
      type: 'contract_template_updated',
      userId,
      data: { action: 'status_changed', id, status: body.status },
    });
    return result;
  }

  @Delete('templates/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Delete contract template' })
  @ApiParam({ name: 'id', description: 'Template ID' })
  @ApiResponse({ status: 200, description: 'Template deleted' })
  async deleteContractTemplate(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.uid;
    const result = await this.contractService.deleteTemplate(id, userId);
    this.eventsService.emit({
      type: 'contract_template_updated',
      userId,
      data: { action: 'deleted', id },
    });
    return result;
  }

  @Get('stats/templates')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get template usage statistics' })
  @ApiResponse({ status: 200, description: 'Stats object' })
  async getContractStats(@Req() req: any) {
    const userId = req.user.uid;
    return await this.contractService.getStats(userId);
  }

  // ── Landlord Contracts ──────────────────────────────────────────────────────

  @Post('landlord')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(201)
  @ApiOperation({ summary: 'Landlord sends contract agreement to tenant' })
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiResponse({ status: 201, description: 'Contract sent successfully' })
  async sendContractToTenant(
    @Req() req: any,
    @Body() body: any,
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    const userId = req.user.uid || req.user.id;
    const email = req.user.email || '';

    // If sent via FormData with JSON contractData string
    let parsedBody = body;
    if (typeof body.contractData === 'string') {
      try {
        parsedBody = { ...JSON.parse(body.contractData), ...body };
      } catch {
        parsedBody = body;
      }
    }

    const result = await this.contractService.sendContractToTenant(userId, email, parsedBody, file);

    this.eventsService.emit({
      type: 'contract_sent',
      userId,
      targetEmail: parsedBody.tenantEmail || parsedBody.recipientEmail,
      data: {
        contractId: (result as any)?.id,
        tenantEmail: parsedBody.tenantEmail || parsedBody.recipientEmail,
        landlordEmail: email,
        title: parsedBody.title || parsedBody.contractName,
      },
    });

    return result;
  }

  @Post('landlord/base64')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a landlord contract with base64 encoded document' })
  @ApiResponse({ status: 201, description: 'Contract created successfully' })
  async createContractWithBase64(@Req() req: any, @Body() body: any) {
    const userId = req.user?.uid || req.user?.id;
    return await this.contractService.createContractWithBase64(body, userId);
  }

  @Get('landlord/expiring')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get contracts expiring soon' })
  @ApiQuery({ name: 'days', required: false, schema: { default: 7 } })
  @ApiResponse({ status: 200, description: 'List of expiring contracts' })
  async getExpiringContracts(@Query('days') days = 7) {
    return await this.contractService.getExpiringContracts(Number(days) || 7);
  }

  @Get('landlord/exists')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Check if a contract exists between landlord and tenant' })
  @ApiQuery({ name: 'tenantEmail' })
  @ApiQuery({ name: 'title' })
  @ApiQuery({ name: 'landlordEmail' })
  @ApiResponse({ status: 200, description: 'Boolean flag indicating existence' })
  async contractExists(
    @Query('tenantEmail') tenantEmail: string,
    @Query('title') title: string,
    @Query('landlordEmail') landlordEmail: string,
  ) {
    return await this.contractService.contractExists(tenantEmail, title, landlordEmail);
  }

  @Get('landlord')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'List contracts for landlord/agent' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'landlordEmail', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'propertyId', required: false })
  @ApiResponse({ status: 200, description: 'Array of landlord contracts' })
  async getLandlordContracts(
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('landlordEmail') landlordEmail?: string,
    @Query('status') status?: string,
    @Query('propertyId') propertyId?: string,
  ) {
    const effectiveUserId = userId || req.user?.uid || req.user?.id;
    const effectiveEmail = landlordEmail || req.user?.email;
    return await this.contractService.getLandlordContracts({
      userId: effectiveUserId,
      landlordEmail: effectiveEmail,
      status,
      propertyId,
    });
  }

  @Get('landlord/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get single landlord contract by ID' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract details' })
  async getLandlordContractById(@Param('id') id: string) {
    return await this.contractService.getContractById(id);
  }

  @Put('landlord/:id/status')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Update landlord contract status' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateLandlordContractStatus(
    @Param('id') id: string,
    @Body() body: { status: string; signedDate?: string },
  ) {
    return await this.contractService.updateContractStatus(id, body.status, body.signedDate);
  }

  @Put('landlord/:id/sign')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Mark contract as signed by tenant or landlord' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Marked as signed' })
  async markContractSigned(
    @Param('id') id: string,
    @Body() body: { signedBy: 'tenant' | 'landlord' },
  ) {
    return await this.contractService.updateContractStatus(id, 'signed', undefined, body.signedBy);
  }

  @Delete('landlord/:id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Delete landlord contract by ID' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract deleted' })
  async deleteLandlordContract(@Param('id') id: string) {
    return await this.contractService.deleteContract(id);
  }

  @Post('landlord/sync')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(201)
  @ApiOperation({ summary: 'Sync signed contract record to landlord dashboard' })
  @ApiResponse({ status: 201, description: 'Contract synced' })
  async syncContractToLandlord(@Req() req: any, @Body() body: any) {
    const result = await this.contractService.syncContractToLandlord(body);
    this.eventsService.emit({
      type: 'contract_synced',
      targetEmail: body.landlordEmail,
      data: {
        contractId: body.contractId,
        status: body.status,
      },
    });
    return result;
  }

  @Post('send-signed-contract')
  @UseGuards(FirebaseAuthGuard)
  @UseInterceptors(FileInterceptor('attachment', {
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB PDF limit
  }))
  @HttpCode(200)
  @ApiOperation({ summary: 'Email signed contract PDF attachment to recipient via Resend' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['to', 'contractName'],
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        recipientName: { type: 'string', description: 'Recipient full name' },
        contractName: { type: 'string', description: 'Title of the contract' },
        attachment: { type: 'string', format: 'binary', description: 'Signed PDF file' },
        htmlContent: { type: 'string', description: 'Optional custom email HTML template' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Email dispatched with messageId' })
  async sendSignedContract(
    @Req() req: any,
    @Body() body: any,
    @UploadedFile() file?: MulterUploadedFile,
  ) {
    const senderEmail = req.user?.email || '';
    return await this.contractService.sendSignedContract(body, senderEmail, file);
  }

  // ── Generic Contract ID Routes (placed last to prevent route collision) ────

  @Get(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get single contract by ID' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract object' })
  async getContractById(@Param('id') id: string) {
    return await this.contractService.getContractById(id);
  }

  @Put(':id/status')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Update contract status by ID' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  async updateContractStatus(
    @Param('id') id: string,
    @Body() body: { status: string; emailSent?: boolean },
  ) {
    return await this.contractService.updateContractStatus(id, body.status);
  }

  @Delete(':id')
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Delete contract by ID' })
  @ApiParam({ name: 'id', description: 'Contract ID' })
  @ApiResponse({ status: 200, description: 'Contract deleted' })
  async deleteContract(@Param('id') id: string) {
    return await this.contractService.deleteContract(id);
  }
}

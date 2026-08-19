import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, HttpCode, Sse, MessageEvent, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ContractService } from '../services/contract.service';
import { EventsService } from '../services/events.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('contracts')
export class ContractController {
  private readonly logger = new Logger(ContractController.name);

  constructor(
    private readonly contractService: ContractService,
    private readonly eventsService: EventsService,
  ) {}

  @Sse('events')
  @UseGuards(FirebaseAuthGuard)
  sendContractEvents(@Req() req: any): Observable<MessageEvent> {
    const userId = req.user.uid;
    const email = req.user.email;
    const role = req.user.role;
    this.logger.log(`[SSE:Contracts] Client connected uid=${userId} email=${email}`);
    return this.eventsService.subscribe(userId, email, role);
  }

  @Get()
  @UseGuards(FirebaseAuthGuard)
  async getContracts(@Req() req: any) {
    const email = req.user.email || '';
    return await this.contractService.getContracts(email);
  }

  @Post('templates')
  @UseGuards(FirebaseAuthGuard)
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
  async getContractTemplates(@Req() req: any, @Query('status') status = 'active') {
    const userId = req.user.uid;
    return await this.contractService.getTemplates(userId, status);
  }

  @Put('templates/:id/status')
  @UseGuards(FirebaseAuthGuard)
  async updateContractTemplateStatus(@Req() req: any, @Param('id') id: string, @Body() body: { status: string }) {
    const userId = req.user.uid;
    const result = await this.contractService.updateTemplateStatus(id, body.status);
    this.eventsService.emit({
      type: 'contract_template_updated',
      userId,
      data: { action: 'status_changed', id, status: body.status },
    });
    return result;
  }

  @Delete('templates/:id')
  @UseGuards(FirebaseAuthGuard)
  async deleteContractTemplate(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.uid;
    const result = await this.contractService.deleteTemplate(id);
    this.eventsService.emit({
      type: 'contract_template_updated',
      userId,
      data: { action: 'deleted', id },
    });
    return result;
  }

  @Get('stats/templates')
  @UseGuards(FirebaseAuthGuard)
  async getContractStats(@Req() req: any) {
    const userId = req.user.uid;
    return await this.contractService.getStats(userId);
  }

  /** POST /api/contracts/landlord — landlord sends a contract to a tenant */
  @Post('landlord')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(201)
  async sendContractToTenant(@Req() req: any, @Body() body: any) {
    const userId = req.user.uid;
    const email = req.user.email || '';
    const result = await this.contractService.sendContractToTenant(userId, email, body);

    // Notify landlord and tenant via SSE
    this.eventsService.emit({
      type: 'contract_sent',
      userId,
      targetEmail: body.tenantEmail,
      data: {
        contractId: (result as any)?.id,
        tenantEmail: body.tenantEmail,
        landlordEmail: email,
        title: body.title,
      },
    });

    return result;
  }

  /** POST /api/contracts/landlord/sync — sync a signed contract to landlord dashboard */
  @Post('landlord/sync')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(201)
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

  /** GET /api/contracts/landlord/exists — check if a contract exists */
  @Get('landlord/exists')
  @UseGuards(FirebaseAuthGuard)
  async contractExists(
    @Query('tenantEmail') tenantEmail: string,
    @Query('title') title: string,
    @Query('landlordEmail') landlordEmail: string,
  ) {
    return await this.contractService.contractExists(tenantEmail, title, landlordEmail);
  }

  /** POST /api/contracts/send-signed-contract — email signed PDF to recipient */
  @Post('send-signed-contract')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(200)
  async sendSignedContract(@Req() req: any, @Body() body: any) {
    return await this.contractService.sendSignedContract(body);
  }
}

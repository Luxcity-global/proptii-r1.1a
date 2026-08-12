import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, HttpCode } from '@nestjs/common';
import { ContractService } from '../services/contract.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('contracts')
export class ContractController {
  constructor(private readonly contractService: ContractService) {}

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
    return await this.contractService.saveTemplate(userId, body);
  }

  @Get('templates')
  @UseGuards(FirebaseAuthGuard)
  async getContractTemplates(@Req() req: any, @Query('status') status = 'active') {
    const userId = req.user.uid;
    return await this.contractService.getTemplates(userId, status);
  }

  @Put('templates/:id/status')
  @UseGuards(FirebaseAuthGuard)
  async updateContractTemplateStatus(@Param('id') id: string, @Body() body: { status: string }) {
    return await this.contractService.updateTemplateStatus(id, body.status);
  }

  @Delete('templates/:id')
  @UseGuards(FirebaseAuthGuard)
  async deleteContractTemplate(@Param('id') id: string) {
    return await this.contractService.deleteTemplate(id);
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
    return await this.contractService.sendContractToTenant(userId, email, body);
  }

  /** POST /api/contracts/landlord/sync — sync a signed contract to landlord dashboard */
  @Post('landlord/sync')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(201)
  async syncContractToLandlord(@Req() req: any, @Body() body: any) {
    return await this.contractService.syncContractToLandlord(body);
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

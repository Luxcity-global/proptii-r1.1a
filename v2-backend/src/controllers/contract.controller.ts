import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
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
}

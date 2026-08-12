import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { BillingService } from '../services/billing.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createCheckout(@Req() req: any, @Body() dto: any) {
    const userId = req.user.uid;
    const email = req.user.email || '';
    return await this.billingService.createCheckoutSession(userId, email, dto);
  }

  @Post('portal')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async createPortal(@Req() req: any) {
    const userId = req.user.uid;
    const email = req.user.email || '';
    return await this.billingService.createPortalSession(userId, email);
  }

  @Get('status')
  @UseGuards(FirebaseAuthGuard)
  async getStatus(@Req() req: any) {
    const userId = req.user.uid;
    return await this.billingService.getBillingStatus(userId);
  }

  @Post('confirm-checkout')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async confirmCheckout(@Req() req: any, @Body() dto: any) {
    const userId = req.user.uid;
    return await this.billingService.confirmCheckoutSession(userId, dto.sessionId);
  }

  @Get('plans')
  async getPlans() {
    return await this.billingService.getPlans();
  }

  @Post('pending-plan')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setPendingPlan(@Req() req: any, @Body() dto: any) {
    const userId = req.user.uid;
    const email = req.user.email || '';
    return await this.billingService.setPendingPlan(userId, email, dto.planId, dto.cycle);
  }

  @Post('downgrade')
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async downgradeToFree(@Req() req: any) {
    const userId = req.user.uid;
    return await this.billingService.downgradeToFree(userId);
  }
}

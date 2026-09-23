import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BillingService } from '../services/billing.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post('checkout')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe checkout session for subscription tier' })
  @ApiResponse({ status: 200, description: 'Stripe checkout session URL' })
  async createCheckout(@Req() req: any, @Body() dto: any) {
    const userId = req.user.uid;
    const email = req.user.email || '';
    return await this.billingService.createCheckoutSession(userId, email, dto);
  }

  @Post('portal')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create Stripe customer billing portal session' })
  @ApiResponse({ status: 200, description: 'Customer portal redirect URL' })
  async createPortal(@Req() req: any) {
    const userId = req.user.uid;
    const email = req.user.email || '';
    return await this.billingService.createPortalSession(userId, email);
  }

  @Get('status')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get current subscription tier, quota, and billing status' })
  @ApiResponse({ status: 200, description: 'Billing status summary' })
  async getStatus(@Req() req: any) {
    const userId = req.user.uid;
    return await this.billingService.getBillingStatus(userId);
  }

  @Post('confirm-checkout')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm checkout completion after Stripe return' })
  @ApiResponse({ status: 200, description: 'Confirmation status' })
  async confirmCheckout(@Req() req: any, @Body() dto: any) {
    const userId = req.user.uid;
    return await this.billingService.confirmCheckoutSession(userId, dto.sessionId);
  }

  @Get('plans')
  @ApiOperation({ summary: 'List available subscription plans and feature pricing tiers' })
  @ApiResponse({ status: 200, description: 'Array of plans' })
  async getPlans() {
    return await this.billingService.getPlans();
  }

  @Post('pending-plan')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Record plan selected during onboarding before checkout' })
  @ApiResponse({ status: 200, description: 'Pending plan set' })
  async setPendingPlan(@Req() req: any, @Body() dto: any) {
    const userId = req.user.uid;
    const email = req.user.email || '';
    return await this.billingService.setPendingPlan(userId, email, dto.planId, dto.cycle);
  }

  @Post('downgrade')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Downgrade subscription to free Explorer tier' })
  @ApiResponse({ status: 200, description: 'Downgrade confirmed' })
  async downgradeToFree(@Req() req: any) {
    const userId = req.user.uid;
    return await this.billingService.downgradeToFree(userId);
  }
}

import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { GuestEnquiryService } from '../services/guest-enquiry.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller('guest')
export class GuestEnquiryController {
  constructor(private readonly guestEnquiryService: GuestEnquiryService) {}

  @Post('enquiry')
  @HttpCode(HttpStatus.CREATED)
  async submitEnquiry(@Body() body: any) {
    return await this.guestEnquiryService.submitEnquiry(body);
  }

  @Get('thread/:token')
  async getThread(@Param('token') token: string) {
    return await this.guestEnquiryService.getThreadByToken(token);
  }

  @Post('thread/:token/reply')
  @HttpCode(HttpStatus.CREATED)
  async addReply(@Param('token') token: string, @Body() body: any) {
    return await this.guestEnquiryService.addReply(token, body);
  }

  @Post('claim/auto-merge')
  @UseGuards(FirebaseAuthGuard)
  async autoMerge(@Req() req: any, @Body() body: { email?: string }) {
    const userId = req.user.uid;
    const email = body.email || req.user.email;
    return await this.guestEnquiryService.autoMerge(email, userId);
  }

  /** POST /api/guest/claim/validate — validate a claim token */
  @Post('claim/validate')
  async validateClaimToken(@Body() body: { token: string }) {
    return await this.guestEnquiryService.validateClaimToken(body.token);
  }

  /** POST /api/guest/claim/resend — resend a claim email */
  @Post('claim/resend')
  async resendClaimToken(@Body() body: { email: string }) {
    return await this.guestEnquiryService.resendClaimToken(body.email);
  }

  /** POST /api/guest/claim/confirm — confirm claim and merge guest account */
  @Post('claim/confirm')
  @UseGuards(FirebaseAuthGuard)
  async confirmClaim(@Req() req: any, @Body() body: { token: string }) {
    const userId = req.user.uid;
    const email = req.user.email;
    return await this.guestEnquiryService.confirmClaim(body.token, email, userId);
  }
}

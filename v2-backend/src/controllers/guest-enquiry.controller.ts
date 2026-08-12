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
}

import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody } from '@nestjs/swagger';
import { GuestEnquiryService } from '../services/guest-enquiry.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Communication')
@Controller('guest')
export class GuestEnquiryController {
  constructor(private readonly guestEnquiryService: GuestEnquiryService) {}

  @Post('enquiry')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit guest property enquiry without creating account' })
  @ApiResponse({ status: 201, description: 'Guest enquiry submitted' })
  async submitEnquiry(@Body() body: any) {
    return await this.guestEnquiryService.submitEnquiry(body);
  }

  @Get('thread/:token')
  @ApiOperation({ summary: 'Access guest enquiry conversation thread via magic token' })
  @ApiParam({ name: 'token', description: 'Guest access token' })
  @ApiResponse({ status: 200, description: 'Thread messages' })
  async getThread(@Param('token') token: string) {
    return await this.guestEnquiryService.getThreadByToken(token);
  }

  @Post('thread/:token/reply')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reply to guest conversation thread' })
  @ApiParam({ name: 'token', description: 'Guest access token' })
  @ApiResponse({ status: 201, description: 'Reply posted' })
  async addReply(@Param('token') token: string, @Body() body: any) {
    return await this.guestEnquiryService.addReply(token, body);
  }

  @Post('claim/auto-merge')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Auto-merge guest enquiries matching authenticated email' })
  @ApiResponse({ status: 200, description: 'Merge result' })
  async autoMerge(@Req() req: any) {
    const userId = req.user.uid;
    const email = req.user.email;
    if (!email) {
      return { data: { success: false, message: 'Authenticated user email required' } };
    }
    return await this.guestEnquiryService.autoMerge(email, userId);
  }

  /** POST /api/guest/claim/validate — validate a claim token */
  @Post('claim/validate')
  @ApiOperation({ summary: 'Validate guest account claim token' })
  @ApiResponse({ status: 200, description: 'Token validation state' })
  async validateClaimToken(@Body() body: { token: string }) {
    return await this.guestEnquiryService.validateClaimToken(body.token);
  }

  /** POST /api/guest/claim/resend — resend a claim email */
  @Post('claim/resend')
  @ApiOperation({ summary: 'Resend guest claim email' })
  @ApiResponse({ status: 200, description: 'Claim email sent' })
  async resendClaimToken(@Body() body: { email: string }) {
    return await this.guestEnquiryService.resendClaimToken(body.email);
  }

  /** POST /api/guest/claim/confirm — confirm claim and merge guest account */
  @Post('claim/confirm')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Confirm claim token and merge enquiries into user account' })
  @ApiResponse({ status: 200, description: 'Account merge confirmed' })
  async confirmClaim(@Req() req: any, @Body() body: { token: string }) {
    const userId = req.user.uid;
    const email = req.user.email;
    return await this.guestEnquiryService.confirmClaim(body.token, email, userId);
  }
}

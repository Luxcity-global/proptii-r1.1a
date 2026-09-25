import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RefereeGuarantorService } from '../services/referee-guarantor.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@ApiTags('Referencing')
@Controller()
export class RefereeGuarantorController {
  constructor(private readonly service: RefereeGuarantorService) {}

  /** GET /api/referee-guarantor-responses */
  @Get('referee-guarantor-responses')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get referee and guarantor responses for current user application' })
  @ApiResponse({ status: 200, description: 'Responses array' })
  async getResponses(@Req() req: any) {
    return this.service.getResponses(req.user.uid);
  }

  /** POST /api/referee-guarantor-responses — save an incoming response */
  @Post('referee-guarantor-responses')
  @ApiOperation({ summary: 'Submit referee or guarantor response (public link submission)' })
  @ApiResponse({ status: 201, description: 'Response saved' })
  async saveResponse(@Body() body: any) {
    return this.service.saveResponse(body);
  }

  /** POST /api/referencing/send-email — send referee/guarantor email */
  @Post('referencing/send-email')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Send questionnaire email to referee or guarantor' })
  @ApiResponse({ status: 200, description: 'Email dispatched' })
  async sendEmail(@Body() body: {
    to: string;
    tenantName: string;
    type: 'referee' | 'guarantor';
    formUrl: string;
    senderName?: string;
  }) {
    return this.service.sendReferencingEmail(body);
  }

  /** POST /api/referencing/invite-guarantor — send guarantor invite and notify tenant */
  @Post('referencing/invite-guarantor')
  @ApiOperation({ summary: 'Invite guarantor with secure link' })
  @ApiResponse({ status: 200, description: 'Guarantor invited' })
  async inviteGuarantor(
    @Req() req: any,
    @Body() body: {
      guarantorName: string;
      guarantorEmail: string;
      guarantorPhone?: string;
      message?: string;
      tenantName?: string;
      tenantEmail?: string;
      tenantId?: string;
    }
  ) {
    const tenantId = req.user?.uid || req.user?.id || body.tenantId || 'anonymous';
    const tenantEmail = body.tenantEmail || req.user?.email || '';
    const tenantName = body.tenantName || req.user?.name || 'Applicant';

    return this.service.inviteGuarantor({
      tenantId,
      tenantName,
      tenantEmail,
      guarantorName: body.guarantorName,
      guarantorEmail: body.guarantorEmail,
      guarantorPhone: body.guarantorPhone,
      message: body.message,
      frontendUrl: (body as any).frontendUrl,
    });
  }

  /** GET /api/referencing/guarantor-invite — fetch guarantor invite details by token */
  @Get('referencing/guarantor-invite')
  @ApiOperation({ summary: 'Fetch guarantor invite details by token' })
  @ApiQuery({ name: 'token', description: 'Guarantor token' })
  @ApiResponse({ status: 200, description: 'Guarantor invite data' })
  async getGuarantorInvite(@Req() req: any) {
    const token = req.query?.token as string;
    return this.service.getGuarantorInvite(token);
  }
}

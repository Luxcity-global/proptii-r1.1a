import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { RefereeGuarantorService } from '../services/referee-guarantor.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';

@Controller()
export class RefereeGuarantorController {
  constructor(private readonly service: RefereeGuarantorService) {}

  /** GET /api/referee-guarantor-responses */
  @Get('referee-guarantor-responses')
  @UseGuards(FirebaseAuthGuard)
  async getResponses(@Req() req: any) {
    return this.service.getResponses(req.user.uid);
  }

  /** POST /api/referee-guarantor-responses — save an incoming response */
  @Post('referee-guarantor-responses')
  async saveResponse(@Body() body: any) {
    return this.service.saveResponse(body);
  }

  /** POST /api/referencing/send-email — send referee/guarantor email */
  @Post('referencing/send-email')
  @UseGuards(FirebaseAuthGuard)
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
  async getGuarantorInvite(@Req() req: any) {
    const token = req.query?.token as string;
    return this.service.getGuarantorInvite(token);
  }
}

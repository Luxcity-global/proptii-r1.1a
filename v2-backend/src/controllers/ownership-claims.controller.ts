import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import {
  DEEPER_CHECK_DOC_TYPES,
  OwnershipClaimsService,
} from '../services/ownership-claims.service';

function isStaffEmail(email?: string): boolean {
  const e = String(email || '').toLowerCase().trim();
  if (!e) return false;
  if (e.endsWith('@proptii.com') || e.endsWith('@theluxcity.co.uk')) return true;
  const allow = String(process.env.ADMIN_EMAILS || process.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(e);
}

@ApiTags('ownership-claims')
@Controller()
export class OwnershipClaimsController {
  constructor(private readonly claims: OwnershipClaimsService) {}

  @Get('native-properties/:id/ownership-claim')
  @UseGuards(FirebaseAuthGuard, RolesGuard)
  @Roles('landlord', 'agent', 'homeowner')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'H4 — landlord-safe claim status for a property (no other-party PII)' })
  async myCase(@Req() req: any, @Param('id') id: string) {
    const uid = req.user?.uid;
    return this.claims.getMyCaseForProperty(uid, id);
  }

  @Get('admin/ownership-claims')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'H4 — staff list of open ownership claim cases' })
  async list(@Req() req: any) {
    if (!isStaffEmail(req.user?.email)) {
      throw new BadRequestException('Staff access required');
    }
    return {
      cases: await this.claims.listOpenCasesForStaff(),
      allowedDocTypes: DEEPER_CHECK_DOC_TYPES,
    };
  }

  @Post('admin/ownership-claims/:id/request-docs')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  async requestDocs(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { docs?: string[] },
  ) {
    if (!isStaffEmail(req.user?.email)) {
      throw new BadRequestException('Staff access required');
    }
    return this.claims.requestDocuments(id, body?.docs || [], req.user?.email);
  }

  @Post('admin/ownership-claims/:id/close')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('bearer')
  async close(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { outcome?: string; note?: string },
  ) {
    if (!isStaffEmail(req.user?.email)) {
      throw new BadRequestException('Staff access required');
    }
    const outcome = body?.outcome;
    if (
      outcome !== 'accepted_claimant' &&
      outcome !== 'accepted_incumbent' &&
      outcome !== 'closed'
    ) {
      throw new BadRequestException('Invalid outcome');
    }
    return this.claims.closeCase(id, outcome, body?.note, req.user?.email);
  }
}

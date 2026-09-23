import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../guards/firebase-auth.guard';
import * as admin from 'firebase-admin';

@ApiTags('Users')
@ApiBearerAuth('bearer')
@Controller('tenant-dashboard')
@UseGuards(FirebaseAuthGuard)
export class TenantDashboardController {
  @Get('summary')
  @ApiOperation({ summary: 'Get tenant summary counts (saved properties, viewings, referencing applications)' })
  @ApiResponse({ status: 200, description: 'Summary statistics object' })
  async getSummary(@Req() req: any) {
    const userId = req.user.uid;
    const db = admin.firestore();

    const [savedSnap, viewingsSnap, referencingSnap] = await Promise.all([
      db.collection('saved_properties').where('userId', '==', userId).get(),
      db.collection('viewings').where('tenantId', '==', userId).get(),
      db.collection('referencing').where('tenantId', '==', userId).get(),
    ]);

    return {
      savedCount: savedSnap.size,
      viewingsCount: viewingsSnap.size,
      referencingCount: referencingSnap.size,
      user: {
        uid: req.user.uid,
        email: req.user.email,
        role: req.user.role,
      },
    };
  }
}

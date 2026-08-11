import { Injectable, Inject, Logger } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';
import { ReferencingService } from './referencing.service';
import { ViewingRequestService } from './viewing-request.service';

@Injectable()
export class TenantDashboardService {
  private readonly logger = new Logger(TenantDashboardService.name);
  private firestore: Firestore | null = null;

  constructor(
    @Inject('FIRESTORE') private readonly firestoreInstance: Firestore | null,
    private readonly referencingService: ReferencingService,
    private readonly viewingRequestService: ViewingRequestService
  ) {
    if (this.firestoreInstance) {
      this.firestore = this.firestoreInstance;
    }
  }

  async getDashboardSummary(userId: string, email: string): Promise<any> {
    // 1. Get Viewings Count
    let viewings = { upcoming: 0, past: 0, total: 0, nextViewing: null };
    try {
      const allViewings = await this.viewingRequestService.findAll(userId, email);
      viewings.total = allViewings.length;
      viewings.upcoming = allViewings.filter(v => v.status === 'upcoming' || v.status === 'PENDING').length;
      viewings.past = allViewings.filter(v => v.status === 'completed' || v.status === 'CONFIRMED').length;
    } catch (e) {
      this.logger.error('Failed to get viewings for summary', e);
    }

    // 2. Get Referencing Status
    let referencing = {
      status: 'not_started',
      progress: 0,
      completedSteps: 0,
      totalSteps: 6,
      identity: false,
      employment: false,
      residential: false,
      financial: false,
      guarantor: false,
      agentDetails: false,
    };
    try {
      if (email) {
        const refStatus = await this.referencingService.getReferencingStatusByEmail(email);
        if (refStatus && refStatus.length > 0) {
          const app = refStatus[0];
          referencing.status = app.status || 'in_progress';
          // Calculate steps if forms exist
        }
      }
    } catch (e) {
      this.logger.error('Failed to get referencing for summary', e);
    }

    // 3. Saved Searches / Files / Contracts
    const files = { count: 0, recentlyAdded: [] };
    const savedSearches = { count: 0, recentSearches: [] };
    const contracts = { pending: 0, signed: 0, total: 0, requested: 0, urgent: [] };

    try {
      if (this.firestore) {
        const filesSnap = await this.firestore.collection('userFiles').where('userId', '==', userId).get();
        files.count = filesSnap.size;
        files.recentlyAdded = filesSnap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 5);
      }
    } catch (e) {
      this.logger.error('Failed to get files for summary', e);
    }

    return {
      savedSearches,
      viewings,
      referencing,
      contracts,
      files
    };
  }
}

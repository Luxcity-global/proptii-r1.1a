import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { Firestore } from 'firebase-admin/firestore';

@Injectable()
export class InsightsService {
  private readonly logger = new Logger(InsightsService.name);
  private firestore: Firestore | null = null;
  private readonly collectionName = 'marketInsights';

  constructor(@Inject('FIRESTORE') private readonly firestoreInstance: Firestore | null) {
    if (this.firestoreInstance) {
      this.firestore = this.firestoreInstance;
    } else {
      this.logger.warn('Firestore not available for InsightsService');
    }
  }

  async getActiveInsights(userId?: string) {
    if (!this.firestore) return [];
    const now = new Date().toISOString();
    
    // We get insights where expiryDate > now
    let snapshot;
    try {
      snapshot = await this.firestore.collection(this.collectionName)
        .where('expiryDate', '>', now)
        .orderBy('expiryDate', 'asc')
        .get();
    } catch (e: any) {
      // Fallback for missing index
      snapshot = await this.firestore.collection(this.collectionName)
        .where('expiryDate', '>', now)
        .get();
    }
    
    let insights = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
    
    if (userId) {
      insights = insights.filter((insight: any) => !insight.dismissedBy?.includes(userId));
    }
    
    // Sort in memory just in case index was missing
    insights.sort((a: any, b: any) => {
      const severityOrder: any = { high: 3, medium: 2, low: 1 };
      const severityDiff = (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    return insights.slice(0, 10);
  }

  async dismissInsight(insightId: string, userId: string) {
    if (!this.firestore) throw new Error('Firestore not available');
    const docRef = this.firestore.collection(this.collectionName).doc(insightId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new NotFoundException(`Insight with ID ${insightId} not found`);
    }
    
    const data = docSnap.data();
    const dismissedBy = data?.dismissedBy || [];
    if (!dismissedBy.includes(userId)) {
      await docRef.update({
        dismissedBy: [...dismissedBy, userId],
        updatedAt: new Date().toISOString()
      });
    }
    
    return { success: true };
  }

  async bulkCreate(insights: any[]) {
    if (!this.firestore) throw new Error('Firestore not available');
    const batch = this.firestore.batch();
    
    for (const insight of insights) {
      // Check if it exists
      const existingSnap = await this.firestore.collection(this.collectionName)
        .where('type', '==', insight.type)
        .where('title', '==', insight.title)
        .where('expiryDate', '>', new Date().toISOString())
        .get();
        
      if (existingSnap.empty) {
        const docRef = this.firestore.collection(this.collectionName).doc();
        batch.set(docRef, {
          ...insight,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    await batch.commit();
    return { success: true };
  }
}

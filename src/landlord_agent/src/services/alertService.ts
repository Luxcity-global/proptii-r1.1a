import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Tenant } from '../App';
import emailService from '../../../services/emailService';

const isDevLoggingEnabled = import.meta.env.DEV;
const isVerboseAlertLoggingEnabled = import.meta.env.VITE_ALERT_DEBUG === 'true';

const debugLog = (...args: any[]) => {
  if (isDevLoggingEnabled && isVerboseAlertLoggingEnabled) {
    console.log(...args);
  }
};

const debugWarn = (...args: any[]) => {
  if (isDevLoggingEnabled && isVerboseAlertLoggingEnabled) {
    console.warn(...args);
  }
};

export type AlertType = 'lease-expiry' | 'unsigned-contract' | 'rent-arrears';
export type AlertStatus = 'active' | 'resolved' | 'dismissed';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  status: AlertStatus;
  severity: AlertSeverity;
  userId: string; // Landlord/agent who owns this alert
  
  // Related entity references
  tenantId?: string;
  contractId?: string;
  propertyId?: string;
  
  // Alert metadata
  title: string;
  description: string;
  
  // Type-specific data
  leaseExpiryDate?: Date;
  daysUntilExpiry?: number;
  contractTitle?: string;
  contractSentDate?: Date;
  overdueAmount?: number;
  daysPastDue?: number;
  lastPaymentDate?: Date;
  paymentFrequency?: 'monthly' | 'yearly' | 'fixed-time';
  
  // Additional metadata
  propertyAddress?: string;
  tenantName?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
  dismissedAt?: Date;
}

type OverdueNotice = {
  tenant: Tenant;
  kind: 'first' | 'expired';
  overdueAmount: number;
  daysPastDue: number;
};

function readManagerEmail(): string | null {
  try {
    const raw = localStorage.getItem('proptii_auth_state');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user?.email || parsed?.email || null;
  } catch {
    return null;
  }
}

function overdueEmailHtml(opts: {
  recipientName: string;
  intro: string;
  tenantName: string;
  propertyAddress: string;
  amount: number;
  daysPastDue: number;
}): string {
  return `<!DOCTYPE html>
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <p>Hi ${opts.recipientName || 'there'},</p>
      <p>${opts.intro}</p>
      <p><strong>Tenant:</strong> ${opts.tenantName}</p>
      <p><strong>Property:</strong> ${opts.propertyAddress}</p>
      <p><strong>Amount overdue:</strong> £${opts.amount.toLocaleString()}</p>
      <p><strong>Days past due:</strong> ${opts.daysPastDue}</p>
      <p>Thanks,<br>The Proptii Team</p>
    </body>
    </html>`;
}
const MAX_FREQUENCY_ITERATIONS = 120;
const MS_IN_DAY = 24 * 60 * 60 * 1000;

type EvaluatedPaymentStatus = {
  status: Tenant['paymentStatus'];
  overdueAmount: number;
  daysPastDue: number;
  dueDate?: Date;
};

function normaliseDate(value?: Date | string | null): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function addFrequencyInterval(date: Date, frequency: NonNullable<Tenant['paymentFrequency']>): Date {
  const next = new Date(date.getTime());
  if (frequency === 'monthly') {
    next.setMonth(next.getMonth() + 1);
  } else if (frequency === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  }
  return next;
}

function evaluateTenantPaymentStatus(tenant: Tenant, now: Date): EvaluatedPaymentStatus | null {
  // Do not auto-adjust tenants on payment plans
  if (tenant.paymentStatus === 'payment-plan') {
    return null;
  }

  const rentAmount = tenant.rentAmount || 0;
  if (rentAmount <= 0) {
    return null;
  }

  const frequency: NonNullable<Tenant['paymentFrequency']> = (tenant.paymentFrequency || 'monthly') as NonNullable<Tenant['paymentFrequency']>;
  const firstDue = normaliseDate(tenant.firstPaymentDate) || normaliseDate(tenant.leaseStart);
  if (!firstDue) {
    return null;
  }

  const lastPayment = normaliseDate(tenant.lastPaymentDate);

  if (frequency === 'fixed-time') {
    const hasPaid = lastPayment ? lastPayment.getTime() >= firstDue.getTime() : false;
    const isOverdue = !hasPaid && now.getTime() > firstDue.getTime();
    const daysPastDue = isOverdue ? Math.max(1, Math.ceil((now.getTime() - firstDue.getTime()) / MS_IN_DAY)) : 0;
    return {
      status: isOverdue ? 'overdue' : 'current',
      overdueAmount: isOverdue ? rentAmount : 0,
      daysPastDue,
      dueDate: firstDue
    };
  }

  let dueDate = new Date(firstDue.getTime());
  let iterations = 0;

  if (lastPayment) {
    while (dueDate.getTime() <= lastPayment.getTime() && iterations < MAX_FREQUENCY_ITERATIONS) {
      dueDate = addFrequencyInterval(dueDate, frequency);
      iterations += 1;
    }
  }

  // Safety net to avoid runaway loops
  if (iterations >= MAX_FREQUENCY_ITERATIONS) {
    console.warn(`⚠️ AlertService: Hit iteration cap while evaluating payment schedule for tenant ${tenant.id}`);
  }

  const isOverdue = now.getTime() > dueDate.getTime();
  const daysPastDue = isOverdue ? Math.max(1, Math.ceil((now.getTime() - dueDate.getTime()) / MS_IN_DAY)) : 0;

  return {
    status: isOverdue ? 'overdue' : 'current',
    overdueAmount: isOverdue ? rentAmount : 0,
    daysPastDue,
    dueDate
  };
}

class AlertService {
  private alertsCollection = collection(db, 'alerts');

  /**
   * Create a new alert
   */
  async createAlert(alertData: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const alertDoc = {
        ...alertData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        leaseExpiryDate: alertData.leaseExpiryDate ? Timestamp.fromDate(alertData.leaseExpiryDate) : undefined,
        contractSentDate: alertData.contractSentDate ? Timestamp.fromDate(alertData.contractSentDate) : undefined,
        lastPaymentDate: alertData.lastPaymentDate ? Timestamp.fromDate(alertData.lastPaymentDate) : undefined,
        resolvedAt: alertData.resolvedAt ? Timestamp.fromDate(alertData.resolvedAt) : undefined,
        dismissedAt: alertData.dismissedAt ? Timestamp.fromDate(alertData.dismissedAt) : undefined,
      };
      
      const docRef = await addDoc(this.alertsCollection, alertDoc);
      debugLog('✅ AlertService: Created alert:', docRef.id, alertData.type);
      return docRef.id;
    } catch (error) {
      console.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Get all alerts for a user with optional filters
   */
  async getAlerts(
    userId: string,
    filters?: {
      type?: AlertType;
      status?: AlertStatus;
      severity?: AlertSeverity;
    }
  ): Promise<Alert[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId)
      ];

      if (filters?.type) {
        constraints.push(where('type', '==', filters.type));
      }
      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }
      if (filters?.severity) {
        constraints.push(where('severity', '==', filters.severity));
      }

      try {
        constraints.push(orderBy('createdAt', 'desc'));
        const q = query(this.alertsCollection, ...constraints);
        const querySnapshot = await getDocs(q);
        return this.mapAlertDocs(querySnapshot.docs);
      } catch (indexError: any) {
        if (indexError.code === 'failed-precondition' && indexError.message?.includes('index')) {
          console.log('ℹ️ Firestore index not configured, using in-memory sort');
          const q = query(this.alertsCollection, ...constraints.slice(0, -1));
          const querySnapshot = await getDocs(q);
          const alerts = this.mapAlertDocs(querySnapshot.docs);
          return alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        throw indexError;
      }
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw error;
    }
  }

  /**
   * Get active alerts (for Priority Alerts card)
   */
  async getActiveAlerts(userId: string): Promise<Alert[]> {
    return this.getAlerts(userId, { status: 'active' });
  }

  /**
   * Get a single alert by ID
   */
  async getAlert(alertId: string): Promise<Alert | null> {
    try {
      const docRef = doc(this.alertsCollection, alertId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return this.mapAlertDoc(docSnap.id, docSnap.data());
      }
      return null;
    } catch (error) {
      console.error('Error getting alert:', error);
      throw error;
    }
  }

  /**
   * Update alert status
   */
  async updateAlertStatus(
    alertId: string,
    status: AlertStatus
  ): Promise<void> {
    try {
      const docRef = doc(this.alertsCollection, alertId);
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      if (status === 'resolved') {
        updateData.resolvedAt = Timestamp.now();
      } else if (status === 'dismissed') {
        updateData.dismissedAt = Timestamp.now();
      }

      await updateDoc(docRef, updateData);
      debugLog('✅ AlertService: Updated alert status:', alertId, status);
    } catch (error) {
      console.error('Error updating alert status:', error);
      throw error;
    }
  }

  /**
   * Delete an alert
   */
  async deleteAlert(alertId: string): Promise<void> {
    try {
      const docRef = doc(this.alertsCollection, alertId);
      await deleteDoc(docRef);
      debugLog('✅ AlertService: Deleted alert:', alertId);
    } catch (error) {
      console.error('Error deleting alert:', error);
      throw error;
    }
  }

  async getActiveAlert(
    userId: string,
    type: AlertType,
    entityId: string
  ): Promise<{ id: string; data: Record<string, unknown> } | null> {
    try {
      const fieldMap: Record<AlertType, string> = {
        'lease-expiry': 'tenantId',
        'unsigned-contract': 'contractId',
        'rent-arrears': 'tenantId'
      };

      const field = fieldMap[type];
      const q = query(
        this.alertsCollection,
        where('userId', '==', userId),
        where('type', '==', type),
        where('status', '==', 'active'),
        where(field, '==', entityId)
      );

      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) return null;
      const snap = querySnapshot.docs[0];
      return { id: snap.id, data: snap.data() as Record<string, unknown> };
    } catch (error) {
      console.error('Error loading active alert:', error);
      return null;
    }
  }

  /**
   * Check if alert already exists for a given entity
   */
  async alertExists(
    userId: string,
    type: AlertType,
    entityId: string
  ): Promise<boolean> {
    const existing = await this.getActiveAlert(userId, type, entityId);
    return Boolean(existing);
  }

  /**
   * Generate alerts from tenants, contracts, etc.
   * This is called periodically or on-demand to check for new alerts
   */
  async generateAlerts(userId: string): Promise<void> {
    debugLog('🔔 AlertService: Generating alerts for userId:', userId);
    
    // Import services here to avoid circular dependencies
    const { tenantService } = await import('./tenantService');
    const { contractService } = await import('./contractService');

    const batch = writeBatch(db);
    let alertCount = 0;
    let tenantStatusUpdates = 0;
    const overdueNotices: OverdueNotice[] = [];

    try {
      // 1. Check for lease expiry alerts
      const tenants = await tenantService.getTenants(userId);
      const now = new Date();
      // Set to start of today for accurate date comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      debugLog('🔍 AlertService: Checking lease expiry alerts');
      debugLog(`   Today: ${today.toISOString()}`);
      debugLog(`   30 days from now: ${thirtyDaysFromNow.toISOString()}`);
      debugLog(`   Checking ${tenants.length} tenants`);

      for (const tenant of tenants) {
        let computedDaysPastDue: number | null = null;

        const evaluatedStatus = evaluateTenantPaymentStatus(tenant, today);
        if (evaluatedStatus) {
          const tenantOverdueAmount = typeof tenant.overdueAmount === 'number' ? tenant.overdueAmount : 0;
          const statusChanged = tenant.paymentStatus !== evaluatedStatus.status;
          const overdueChanged = tenantOverdueAmount !== evaluatedStatus.overdueAmount;
          const hasManualOverdue = tenant.paymentStatus === 'overdue' && tenantOverdueAmount > 0;
          const shouldApplyEvaluatedStatus = !hasManualOverdue || evaluatedStatus.status === 'overdue';

          if (shouldApplyEvaluatedStatus && (statusChanged || overdueChanged)) {
            const tenantRef = doc(db, 'tenants', tenant.id);
            batch.update(tenantRef, {
              paymentStatus: evaluatedStatus.status,
              overdueAmount: evaluatedStatus.overdueAmount,
              updatedAt: Timestamp.now()
            });
            tenantStatusUpdates++;
            tenant.paymentStatus = evaluatedStatus.status;
            tenant.overdueAmount = evaluatedStatus.overdueAmount;
          }

          if (evaluatedStatus.status === 'overdue') {
            computedDaysPastDue = evaluatedStatus.daysPastDue;
          }
        }

        // Check both 'active' and 'pending' tenants for lease expiry alerts
        // (pending tenants might have leases expiring before they even move in)
        if (tenant.leaseEnd && (tenant.status === 'active' || tenant.status === 'pending')) {
          const leaseEnd = tenant.leaseEnd instanceof Date ? tenant.leaseEnd : new Date(tenant.leaseEnd);
          // Compare dates only (ignore time)
          const leaseEndDate = new Date(leaseEnd.getFullYear(), leaseEnd.getMonth(), leaseEnd.getDate());
          
          // Check if lease expires within 30 days (including today and tomorrow)
          const daysUntilExpiry = Math.ceil((leaseEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          debugLog(`   Tenant: ${tenant.name}, Lease End: ${leaseEndDate.toISOString()}, Days until expiry: ${daysUntilExpiry}, Status: ${tenant.status}`);
          
          if (daysUntilExpiry >= 0 && daysUntilExpiry <= 30) {
            // Check if alert exists for this tenant
            const existsForTenant = await this.alertExists(userId, 'lease-expiry', tenant.id);
            
            // Also check if alert exists for this property (to avoid duplicates for same property)
            let existingPropertyAlert = null;
            if (tenant.propertyId) {
              const propertyAlertsQuery = query(
                this.alertsCollection,
                where('userId', '==', userId),
                where('type', '==', 'lease-expiry'),
                where('status', '==', 'active'),
                where('propertyId', '==', tenant.propertyId)
              );
              const propertyAlertsSnapshot = await getDocs(propertyAlertsQuery);
              if (!propertyAlertsSnapshot.empty) {
                existingPropertyAlert = propertyAlertsSnapshot.docs[0];
              }
            }
            
            debugLog(`   Alert exists for tenant? ${existsForTenant}`);
            debugLog(`   Alert exists for property? ${existingPropertyAlert !== null}`);
            
            if (!existsForTenant && !existingPropertyAlert) {
              // No alert exists - create new one
              const severity = daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 14 ? 'high' : 'medium';
              const alertRef = doc(this.alertsCollection);
              batch.set(alertRef, {
                type: 'lease-expiry',
                status: 'active',
                severity,
                userId,
                tenantId: tenant.id,
                propertyId: tenant.propertyId,
                title: `Lease Expiring Soon - ${tenant.name}`,
                description: `Lease for ${tenant.propertyAddress} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
                leaseExpiryDate: Timestamp.fromDate(leaseEnd),
                daysUntilExpiry,
                propertyAddress: tenant.propertyAddress,
                tenantName: tenant.name,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
              });
              alertCount++;
              debugLog(`   ✅ Created lease expiry alert for ${tenant.name} (${daysUntilExpiry} days)`);
            } else if (existingPropertyAlert) {
              // Alert exists for this property - check if we should update it with earlier expiry
              const existingAlertData = existingPropertyAlert.data();
              const existingDaysUntilExpiry = existingAlertData.daysUntilExpiry || 999;
              
              if (daysUntilExpiry < existingDaysUntilExpiry) {
                // This tenant's lease expires sooner - update the alert
                const alertRef = doc(this.alertsCollection, existingPropertyAlert.id);
                const severity = daysUntilExpiry <= 7 ? 'critical' : daysUntilExpiry <= 14 ? 'high' : 'medium';
                batch.update(alertRef, {
                  tenantId: tenant.id,
                  title: `Lease Expiring Soon - ${tenant.name}`,
                  description: `Lease for ${tenant.propertyAddress} expires in ${daysUntilExpiry} day${daysUntilExpiry !== 1 ? 's' : ''}`,
                  leaseExpiryDate: Timestamp.fromDate(leaseEnd),
                  daysUntilExpiry,
                  tenantName: tenant.name,
                  severity,
                  updatedAt: Timestamp.now()
                });
                debugLog(`   ✅ Updated property alert with earlier expiry for ${tenant.name} (${daysUntilExpiry} days, was ${existingDaysUntilExpiry})`);
              } else {
                debugLog(`   ⏭️  Alert already exists for property ${tenant.propertyAddress} with earlier expiry (${existingDaysUntilExpiry} days)`);
              }
            } else {
              debugLog(`   ⏭️  Alert already exists for ${tenant.name}`);
            }
          } else {
            debugLog(`   ⏭️  Tenant ${tenant.name}: lease expires in ${daysUntilExpiry} days (outside 30-day window)`);
          }
        } else {
          if (tenant.leaseEnd) {
            debugLog(`   ⏭️  Tenant ${tenant.name}: status is ${tenant.status} (not active or pending)`);
          } else {
            debugLog(`   ⏭️  Tenant ${tenant.name}: no leaseEnd date`);
          }
        }

        // 2. Check for rent arrears alerts
        const overdueAmountValue = typeof tenant.overdueAmount === 'number' ? tenant.overdueAmount : 0;
        if (tenant.paymentStatus === 'overdue' && overdueAmountValue > 0) {
          const existing = await this.getActiveAlert(userId, 'rent-arrears', tenant.id);

          const lastPayment = tenant.lastPaymentDate instanceof Date
            ? tenant.lastPaymentDate
            : tenant.lastPaymentDate
              ? new Date(tenant.lastPaymentDate)
              : null;

          const fallbackDaysPastDue = lastPayment
            ? Math.max(1, Math.ceil((now.getTime() - lastPayment.getTime()) / MS_IN_DAY))
            : 0;

          const daysPastDue = computedDaysPastDue ?? fallbackDaysPastDue;
          const leaseEnd = tenant.leaseEnd instanceof Date
            ? tenant.leaseEnd
            : tenant.leaseEnd
              ? new Date(tenant.leaseEnd)
              : null;
          const leaseExpired = Boolean(leaseEnd && !Number.isNaN(leaseEnd.getTime()) && leaseEnd.getTime() < today.getTime());
          const isExpiredOverdue = daysPastDue >= 30 || leaseExpired;
          const severity = isExpiredOverdue ? 'critical' : daysPastDue >= 14 ? 'high' : 'medium';

          if (!existing) {
            const alertRef = doc(this.alertsCollection);
            const alertData: any = {
              type: 'rent-arrears',
              status: 'active',
              severity,
              userId,
              tenantId: tenant.id,
              propertyId: tenant.propertyId,
              title: `Rent Arrears - ${tenant.name}`,
              description: `£${overdueAmountValue.toLocaleString()} overdue for ${tenant.propertyAddress}`,
              overdueAmount: overdueAmountValue,
              daysPastDue,
              paymentFrequency: (tenant as any).paymentFrequency || 'monthly',
              propertyAddress: tenant.propertyAddress,
              tenantName: tenant.name,
              expiryNotified: isExpiredOverdue,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            };

            if (lastPayment) {
              alertData.lastPaymentDate = Timestamp.fromDate(lastPayment);
            }

            batch.set(alertRef, alertData);
            alertCount++;
            overdueNotices.push({
              tenant,
              kind: isExpiredOverdue ? 'expired' : 'first',
              overdueAmount: overdueAmountValue,
              daysPastDue,
            });
          } else if (isExpiredOverdue && !existing.data.expiryNotified) {
            const alertRef = doc(this.alertsCollection, existing.id);
            batch.update(alertRef, {
              expiryNotified: true,
              severity: 'critical',
              daysPastDue,
              overdueAmount: overdueAmountValue,
              updatedAt: Timestamp.now()
            });
            overdueNotices.push({
              tenant,
              kind: 'expired',
              overdueAmount: overdueAmountValue,
              daysPastDue,
            });
          }
        }
      }

      // 3. Check for unsigned contracts
      // Get all contracts (not just 'sent') so we can check status for cleanup
      const allContracts = await contractService.getContracts({ userId });
      const sentContracts = allContracts.filter(c => c.status === 'sent');
      for (const contract of sentContracts) {
        // Check if contract is unsigned and sent more than 7 days ago
        if (contract.status === 'sent' && !contract.signedDate) {
          const sentDate = contract.sentDate instanceof Date ? contract.sentDate : new Date(contract.sentDate);
          const daysSinceSent = Math.ceil((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceSent > 7) {
            const exists = await this.alertExists(userId, 'unsigned-contract', contract.id);
            
            if (!exists) {
              const severity = daysSinceSent >= 30 ? 'high' : daysSinceSent >= 14 ? 'medium' : 'low';
              const alertRef = doc(this.alertsCollection);
              batch.set(alertRef, {
                type: 'unsigned-contract',
                status: 'active',
                severity,
                userId,
                contractId: contract.id,
                title: `Unsigned Contract - ${contract.title}`,
                description: `Contract sent to ${contract.tenantName} on ${sentDate.toLocaleDateString('en-GB')} remains unsigned`,
                contractTitle: contract.title,
                contractSentDate: Timestamp.fromDate(sentDate),
                propertyAddress: contract.propertyAddress,
                tenantName: contract.tenantName,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
              });
              alertCount++;
            }
          }
        }
      }

      // 4. Clean up duplicate alerts for the same property (keep only the one with earliest expiry)
      debugLog('🧹 AlertService: Cleaning up duplicate property alerts');
      const activeAlerts = await this.getActiveAlerts(userId);
      const propertyAlertsMap = new Map<string, Alert[]>();
      const resolvedDuplicateIds = new Set<string>();
      
      // Group lease-expiry alerts by propertyId
      for (const alert of activeAlerts) {
        if (alert.type === 'lease-expiry' && alert.propertyId) {
          if (!propertyAlertsMap.has(alert.propertyId)) {
            propertyAlertsMap.set(alert.propertyId, []);
          }
          propertyAlertsMap.get(alert.propertyId)!.push(alert);
        }
      }
      
      // For each property with multiple alerts, keep only the one with earliest expiry
      for (const [propertyId, alerts] of propertyAlertsMap.entries()) {
        if (alerts.length > 1) {
          // Sort by daysUntilExpiry (ascending - earliest expiry first)
          alerts.sort((a, b) => (a.daysUntilExpiry || 999) - (b.daysUntilExpiry || 999));
          const keepAlert = alerts[0];
          const resolveAlerts = alerts.slice(1);
          
          debugLog(`   🔍 Property ${keepAlert.propertyAddress} has ${alerts.length} alerts, keeping earliest (${keepAlert.daysUntilExpiry} days)`);
          
          for (const alertToResolve of resolveAlerts) {
            resolvedDuplicateIds.add(alertToResolve.id);
            const alertRef = doc(this.alertsCollection, alertToResolve.id);
            batch.update(alertRef, {
              status: 'resolved',
              resolvedAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            debugLog(`   ✅ Resolving duplicate alert for ${alertToResolve.tenantName} (keeping ${keepAlert.tenantName})`);
          }
        }
      }

      // 5. Clean up alerts that no longer meet criteria
      debugLog('🧹 AlertService: Cleaning up outdated alerts');
      let resolvedCount = resolvedDuplicateIds.size;

      for (const alert of activeAlerts) {
        // Skip alerts we've already resolved as duplicates
        if (resolvedDuplicateIds.has(alert.id)) {
          continue;
        }
        
        let shouldResolve = false;
        let reason = '';

        if (alert.type === 'lease-expiry') {
          // Resolve if lease has expired or is outside 30-day window
          if (alert.leaseExpiryDate) {
            const leaseEndDate = new Date(alert.leaseExpiryDate.getFullYear(), alert.leaseExpiryDate.getMonth(), alert.leaseExpiryDate.getDate());
            const daysUntilExpiry = Math.ceil((leaseEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysUntilExpiry < 0) {
              shouldResolve = true;
              reason = 'Lease has expired';
            } else if (daysUntilExpiry > 30) {
              shouldResolve = true;
              reason = 'Lease is outside 30-day warning window';
            } else {
              // Check if tenant still exists and is active/pending
              const tenant = tenants.find(t => t.id === alert.tenantId);
              if (!tenant || (tenant.status !== 'active' && tenant.status !== 'pending')) {
                shouldResolve = true;
                reason = `Tenant status is ${tenant?.status || 'missing'} (not active or pending)`;
              }
            }
          }
        } else if (alert.type === 'rent-arrears') {
          // Resolve if tenant is no longer overdue
          const tenant = tenants.find(t => t.id === alert.tenantId);
          if (!tenant || tenant.paymentStatus !== 'overdue' || !tenant.overdueAmount || tenant.overdueAmount <= 0) {
            shouldResolve = true;
            reason = tenant ? `Tenant payment status is ${tenant.paymentStatus}` : 'Tenant no longer exists';
          }
        } else if (alert.type === 'unsigned-contract') {
          // Resolve if contract has been signed or no longer exists
          const contract = allContracts.find(c => c.id === alert.contractId);
          if (!contract || contract.status !== 'sent' || contract.signedDate) {
            shouldResolve = true;
            reason = contract ? `Contract status is ${contract.status}` : 'Contract no longer exists';
          }
        } else {
          // Unknown alert type - resolve it as it's not part of our current alert system
          shouldResolve = true;
          reason = `Unknown alert type: ${alert.type}`;
        }

        if (shouldResolve) {
          const alertRef = doc(this.alertsCollection, alert.id);
          batch.update(alertRef, {
            status: 'resolved',
            resolvedAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          });
          resolvedCount++;
          debugLog(`   ✅ Resolving alert: ${alert.title} - ${reason}`);
        }
      }

      // Commit all changes (new alerts + resolved alerts)
      const hasChanges = alertCount > 0 || resolvedCount > 0 || tenantStatusUpdates > 0 || overdueNotices.length > 0;
      if (hasChanges) {
        await batch.commit();
        if (alertCount > 0) {
          debugLog(`✅ AlertService: Generated ${alertCount} new alerts`);
        }
        if (resolvedCount > 0) {
          debugLog(`✅ AlertService: Resolved ${resolvedCount} outdated alerts`);
        }
        if (tenantStatusUpdates > 0) {
          debugLog(`✅ AlertService: Updated payment status for ${tenantStatusUpdates} tenant${tenantStatusUpdates === 1 ? '' : 's'}`);
        }
        debugLog(`   Collection: 'alerts'`);
      } else {
        debugLog('✅ AlertService: No changes required (alerts or tenant statuses)');
        debugLog('   This means either:');
        debugLog('   - No tenants have leases expiring within 30 days');
        debugLog('   - Alerts already exist for expiring leases');
        debugLog('   - Tenants are not active or missing leaseEnd dates');
        debugLog('   - All existing alerts are still valid');
      }

      if (overdueNotices.length > 0) {
        const managerEmail = readManagerEmail();
        await Promise.allSettled(overdueNotices.flatMap((notice) => {
          const intro = notice.kind === 'expired'
            ? 'This overdue rent reminder has now reached the expiry threshold and still remains unpaid.'
            : 'Rent is now overdue on this tenancy.';
          const subject = notice.kind === 'expired'
            ? `Overdue rent has expired - ${notice.tenant.propertyAddress}`
            : `Overdue rent reminder - ${notice.tenant.propertyAddress}`;
          const sends: Promise<unknown>[] = [];
          if (notice.tenant.email) {
            sends.push(emailService.sendEmail({
              to: notice.tenant.email,
              subject,
              html: overdueEmailHtml({
                recipientName: notice.tenant.name,
                intro,
                tenantName: notice.tenant.name,
                propertyAddress: notice.tenant.propertyAddress,
                amount: notice.overdueAmount,
                daysPastDue: notice.daysPastDue,
              }),
              attachments: [],
            }));
          }
          if (managerEmail && managerEmail.toLowerCase() !== notice.tenant.email?.toLowerCase()) {
            sends.push(emailService.sendEmail({
              to: managerEmail,
              subject,
              html: overdueEmailHtml({
                recipientName: 'there',
                intro,
                tenantName: notice.tenant.name,
                propertyAddress: notice.tenant.propertyAddress,
                amount: notice.overdueAmount,
                daysPastDue: notice.daysPastDue,
              }),
              attachments: [],
            }));
          }
          return sends;
        }));
      }
    } catch (error) {
      console.error('❌ Error generating alerts:', error);
      console.error('   Error details:', error);
      if (error instanceof Error) {
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Helper to map Firestore documents to Alert objects
   */
  private mapAlertDocs(docs: any[]): Alert[] {
    return docs.map(doc => this.mapAlertDoc(doc.id, doc.data()));
  }

  private mapAlertDoc(id: string, data: any): Alert {
    return {
      id,
      type: data.type,
      status: data.status,
      severity: data.severity,
      userId: data.userId,
      tenantId: data.tenantId,
      contractId: data.contractId,
      propertyId: data.propertyId,
      title: data.title,
      description: data.description,
      leaseExpiryDate: data.leaseExpiryDate?.toDate(),
      daysUntilExpiry: data.daysUntilExpiry,
      contractTitle: data.contractTitle,
      contractSentDate: data.contractSentDate?.toDate(),
      overdueAmount: data.overdueAmount,
      daysPastDue: data.daysPastDue,
      lastPaymentDate: data.lastPaymentDate?.toDate(),
      paymentFrequency: data.paymentFrequency,
      propertyAddress: data.propertyAddress,
      tenantName: data.tenantName,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      resolvedAt: data.resolvedAt?.toDate(),
      dismissedAt: data.dismissedAt?.toDate()
    };
  }
}

export const alertService = new AlertService();


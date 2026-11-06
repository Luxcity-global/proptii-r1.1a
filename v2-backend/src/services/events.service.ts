import { Injectable, Logger, MessageEvent, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { randomUUID } from 'crypto';
import { getRedisClient, getRedisSubscriber } from '../utils/redis-client';

export interface AppServerEvent {
  type: string;
  userId?: string;
  targetEmail?: string;
  targetRole?: string;
  data: any;
  timestamp?: number;
  _nodeId?: string;
}

const EVENTS_CHANNEL = 'proptii:events';

@Injectable()
export class EventsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsService.name);
  private readonly eventSubject = new Subject<AppServerEvent>();
  private readonly nodeId = randomUUID();
  private isSubscribed = false;

  onModuleInit() {
    this.setupRedisSubscriber();
  }

  onModuleDestroy() {
    try {
      const subscriber = getRedisSubscriber();
      if (subscriber && typeof subscriber.unsubscribe === 'function') {
        subscriber.unsubscribe(EVENTS_CHANNEL);
      }
    } catch (err: any) {
      this.logger.debug(`[EventsService] Cleanup subscriber error: ${err?.message}`);
    }
  }

  private setupRedisSubscriber() {
    if (this.isSubscribed) return;

    try {
      const subscriber = getRedisSubscriber();
      if (subscriber && typeof subscriber.subscribe === 'function') {
        subscriber.subscribe(EVENTS_CHANNEL, (err) => {
          if (err) {
            this.logger.warn(`[EventsService] Failed to subscribe to Redis channel ${EVENTS_CHANNEL}: ${err.message}`);
          } else {
            this.isSubscribed = true;
            this.logger.log(`[EventsService] Subscribed to distributed channel ${EVENTS_CHANNEL} (nodeId=${this.nodeId})`);
          }
        });

        subscriber.on('message', (channel: string, message: string) => {
          if (channel !== EVENTS_CHANNEL) return;
          try {
            const remoteEvent = JSON.parse(message) as AppServerEvent;
            // Ignore events published by this exact instance to avoid double-processing
            if (remoteEvent._nodeId === this.nodeId) return;

            this.eventSubject.next(remoteEvent);
          } catch (e: any) {
            this.logger.error(`[EventsService] Error parsing remote event: ${e?.message}`);
          }
        });
      }
    } catch (err: any) {
      this.logger.warn(`[EventsService] Redis subscriber unavailable, running in single-node mode: ${err?.message}`);
    }
  }

  emit(event: AppServerEvent): void {
    const fullEvent: AppServerEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
      _nodeId: this.nodeId,
    };

    this.logger.log(`[emit] type=${fullEvent.type} userId=${fullEvent.userId || '*'} email=${fullEvent.targetEmail || '*'}`);

    // 1. Deliver immediately to local clients connected to this instance
    this.eventSubject.next(fullEvent);

    // 2. Publish to distributed Redis channel for all other instances
    try {
      const redis = getRedisClient();
      if (redis && typeof redis.publish === 'function') {
        redis.publish(EVENTS_CHANNEL, JSON.stringify(fullEvent)).catch((err) => {
          this.logger.debug(`[EventsService] Redis publish error: ${err?.message}`);
        });
      }
    } catch (err: any) {
      // In single-node or fallback mode
    }
  }

  subscribe(userId?: string, userEmail?: string, userRole?: string): Observable<MessageEvent> {
    const normalizedEmail = userEmail?.toLowerCase().trim();

    return new Observable<MessageEvent>((observer) => {
      if (userId) {
        // Emit presence immediately, using a slight delay to allow the connection to establish
        setTimeout(() => {
          this.emit({ type: 'presence_update', data: { userId, isOnline: true } });
        }, 100);
      }

      const subscription = this.eventSubject.asObservable().pipe(
        filter(event => {
          // Global broadcast if no specific target
          if (!event.userId && !event.targetEmail && !event.targetRole) {
            return true;
          }

          // Match by userId
          if (event.userId && userId && event.userId === userId) {
            return true;
          }

          // Match by email
          if (event.targetEmail && normalizedEmail && event.targetEmail.toLowerCase().trim() === normalizedEmail) {
            return true;
          }

          // Match by role (e.g. 'landlord' or 'agent' or 'tenant')
          if (event.targetRole && userRole && event.targetRole === userRole) {
            return true;
          }

          return false;
        }),
        map(event => ({
          data: event,
          type: event.type,
          id: `${event.type}_${event.timestamp || Date.now()}`,
        }))
      ).subscribe(observer);

      return () => {
        subscription.unsubscribe();
        if (userId) {
          this.emit({ type: 'presence_update', data: { userId, isOnline: false } });
        }
      };
    });
  }
}

import { Injectable, Logger, MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface AppServerEvent {
  type: string;
  userId?: string;
  targetEmail?: string;
  targetRole?: string;
  data: any;
  timestamp?: number;
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly eventSubject = new Subject<AppServerEvent>();

  emit(event: AppServerEvent): void {
    const fullEvent: AppServerEvent = {
      ...event,
      timestamp: event.timestamp || Date.now(),
    };
    this.logger.log(`[emit] type=${fullEvent.type} userId=${fullEvent.userId || '*'} email=${fullEvent.targetEmail || '*'}`);
    this.eventSubject.next(fullEvent);
  }

  subscribe(userId?: string, userEmail?: string, userRole?: string): Observable<MessageEvent> {
    const normalizedEmail = userEmail?.toLowerCase().trim();

    return this.eventSubject.asObservable().pipe(
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
    );
  }
}

import { EventGridPublisherClient, AzureKeyCredential } from '@azure/eventgrid';
import { validateEnv } from '../config/environment';
import { AppError } from '../middleware/error-handling';

interface EventGridConfig {
    endpoint: string;
    key: string;
    topicName: string;
}

interface EventData {
    id: string;
    subject: string;
    eventType: string;
    eventTime: string;
    data: any;
    dataVersion: string;
}

export class EventGridService {
    private client: EventGridPublisherClient;
    private config: EventGridConfig;

    constructor() {
        const envConfig = validateEnv();
        this.config = {
            endpoint: process.env.EVENT_GRID_ENDPOINT || '',
            key: process.env.EVENT_GRID_KEY || '',
            topicName: process.env.EVENT_GRID_TOPIC_NAME || ''
        };

        if (!this.config.endpoint || !this.config.key) {
            throw new AppError(500, 'Event Grid configuration missing', 'EVENT_GRID_CONFIG_ERROR');
        }

        this.client = new EventGridPublisherClient(
            this.config.endpoint,
            new AzureKeyCredential(this.config.key)
        );
    }

    async publishEvent(eventData: Omit<EventData, 'id' | 'eventTime'>): Promise<void> {
        try {
            const event: EventData = {
                ...eventData,
                id: `event_${Date.now()}`,
                eventTime: new Date().toISOString()
            };

            await this.client.send([
                {
                    id: event.id,
                    subject: event.subject,
                    eventType: event.eventType,
                    eventTime: event.eventTime,
                    data: event.data,
                    dataVersion: event.dataVersion
                }
            ]);
        } catch (error) {
            throw new AppError(500, 'Failed to publish event', 'EVENT_PUBLISH_ERROR');
        }
    }

    async publishEvents(events: Array<Omit<EventData, 'id' | 'eventTime'>>): Promise<void> {
        try {
            const formattedEvents = events.map(event => ({
                ...event,
                id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                eventTime: new Date().toISOString()
            }));

            await this.client.send(formattedEvents);
        } catch (error) {
            throw new AppError(500, 'Failed to publish events', 'EVENTS_PUBLISH_ERROR');
        }
    }

    // Event types for the application
    static readonly EVENT_TYPES = {
        // Property events
        PROPERTY_CREATED: 'Property.Created',
        PROPERTY_UPDATED: 'Property.Updated',
        PROPERTY_DELETED: 'Property.Deleted',
        PROPERTY_VIEWED: 'Property.Viewed',

        // Viewing events
        VIEWING_CREATED: 'Viewing.Created',
        VIEWING_UPDATED: 'Viewing.Updated',
        VIEWING_CANCELLED: 'Viewing.Cancelled',
        VIEWING_COMPLETED: 'Viewing.Completed',

        // User events
        USER_REGISTERED: 'User.Registered',
        USER_UPDATED: 'User.Updated',
        USER_DELETED: 'User.Deleted',

        // System events
        BACKUP_CREATED: 'System.BackupCreated',
        BACKUP_RESTORED: 'System.BackupRestored',
        ERROR_OCCURRED: 'System.ErrorOccurred'
    };

    // Helper methods for common events
    async publishPropertyCreated(propertyId: string, propertyData: any): Promise<void> {
        await this.publishEvent({
            subject: `/properties/${propertyId}`,
            eventType: EventGridService.EVENT_TYPES.PROPERTY_CREATED,
            data: propertyData,
            dataVersion: '1.0'
        });
    }

    async publishPropertyUpdated(propertyId: string, propertyData: any): Promise<void> {
        await this.publishEvent({
            subject: `/properties/${propertyId}`,
            eventType: EventGridService.EVENT_TYPES.PROPERTY_UPDATED,
            data: propertyData,
            dataVersion: '1.0'
        });
    }

    async publishViewingCreated(viewingId: string, viewingData: any): Promise<void> {
        await this.publishEvent({
            subject: `/viewings/${viewingId}`,
            eventType: EventGridService.EVENT_TYPES.VIEWING_CREATED,
            data: viewingData,
            dataVersion: '1.0'
        });
    }

    async publishError(error: Error, context: any): Promise<void> {
        await this.publishEvent({
            subject: '/system/error',
            eventType: EventGridService.EVENT_TYPES.ERROR_OCCURRED,
            data: {
                error: {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                },
                context
            },
            dataVersion: '1.0'
        });
    }

    // Decorator for automatically publishing events after method execution
    static publishAfter(eventType: string, getSubject: (result: any) => string) {
        return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
            const originalMethod = descriptor.value;
            const eventGridService = new EventGridService();

            descriptor.value = async function (...args: any[]) {
                const result = await originalMethod.apply(this, args);
                
                await eventGridService.publishEvent({
                    subject: getSubject(result),
                    eventType,
                    data: result,
                    dataVersion: '1.0'
                });

                return result;
            };

            return descriptor;
        };
    }
} 
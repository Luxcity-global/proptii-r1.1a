/**
 * Tests for the save-on-message scraped property behaviour.
 *
 * Verifies that ConversationService.getOrCreateConversation() upserts a
 * scraped property to the `scraped_properties` collection when a shadow
 * conversation is created, and that it does NOT do so for native properties.
 */

import { ConversationService } from '../shared/services/ConversationService';
import { ScrapedPropertyModel } from '../shared/models/property.model';
import { ConversationModel, ConversationParticipantModel } from '../shared/models/messaging.models';
import { CreateConversationDto } from '../shared/types/messaging';

// --------------------------------------------------------------------------
// Mocks
// --------------------------------------------------------------------------

jest.mock('../shared/models/property.model', () => ({
    ScrapedPropertyModel: {
        findOneAndUpdate: jest.fn().mockResolvedValue({ url: 'https://example.com/prop1' }),
    },
    NativePropertyModel: {},
}));

jest.mock('../shared/models/messaging.models', () => ({
    ConversationModel: {
        findOne: jest.fn().mockReturnValue({ lean: jest.fn().mockResolvedValue(null) }),
        create: jest.fn().mockResolvedValue({}),
    },
    ConversationParticipantModel: {
        create: jest.fn().mockResolvedValue({}),
    },
    MessageModel: {},
    AuditLogModel: {},
}));

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

const baseScrapedSnapshot = {
    url: 'https://rightmove.co.uk/properties/12345',
    title: '2 Bed Flat in Shoreditch',
    location: 'Shoreditch, London',
    price: '£2,100 pcm',
    bedrooms: 2,
    agent: { name: 'Smith & Co', email: 'agent@smithco.com' },
};

const makeShadowDto = (overrides = {}): CreateConversationDto => ({
    propertyId: 'https://rightmove.co.uk/properties/12345',
    tenantId: 'tenant-abc',
    landlordId: 'UNCLAIMED',
    agentEmail: 'agent@smithco.com',
    propertyTitle: '2 Bed Flat in Shoreditch',
    scrapedPropertySnapshot: baseScrapedSnapshot,
    ...overrides,
});

const makeNativeDto = (): CreateConversationDto => ({
    propertyId: 'native-prop-uuid-001',
    tenantId: 'tenant-abc',
    landlordId: 'landlord-xyz',
});

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('ConversationService — save-on-message scraped property', () => {
    let service: ConversationService;

    beforeEach(() => {
        jest.clearAllMocks();
        service = new ConversationService();
    });

    // -----------------------------------------------------------------------
    describe('Shadow conversation (UNCLAIMED) with snapshot', () => {
        it('upserts the property to scraped_properties before creating conversation', async () => {
            await service.getOrCreateConversation(makeShadowDto());

            expect(ScrapedPropertyModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
            expect(ScrapedPropertyModel.findOneAndUpdate).toHaveBeenCalledWith(
                { url: baseScrapedSnapshot.url },
                expect.objectContaining({
                    $set: expect.objectContaining({
                        url: baseScrapedSnapshot.url,
                        title: baseScrapedSnapshot.title,
                        source: 'scraped',
                    }),
                    $setOnInsert: { landlordId: null },
                }),
                { upsert: true, returnDocument: 'after' },
            );
        });

        it('uses the property URL as propertyId in the conversation', async () => {
            await service.getOrCreateConversation(makeShadowDto());

            expect(ConversationModel.create).toHaveBeenCalledWith(
                expect.objectContaining({ propertyId: baseScrapedSnapshot.url }),
            );
        });

        it('does NOT add a landlord participant for UNCLAIMED conversations', async () => {
            await service.getOrCreateConversation(makeShadowDto());

            // Only the tenant participant should have been created
            const calls = (ConversationParticipantModel.create as jest.Mock).mock.calls;
            expect(calls.length).toBe(1);
            expect(calls[0][0]).toMatchObject({ role: 'tenant', userId: 'tenant-abc' });
        });

        it('is idempotent — returns existing conversation without re-upserting', async () => {
            const existingConv = { id: 'existing-conv-id', propertyId: baseScrapedSnapshot.url };
            (ConversationModel.findOne as jest.Mock).mockReturnValueOnce({
                lean: jest.fn().mockResolvedValue(existingConv),
            });

            const result = await service.getOrCreateConversation(makeShadowDto());

            expect(result.created).toBe(false);
            expect(result.conversation.id).toBe('existing-conv-id');
            // The upsert still runs even on existing conv — property must be in DB
            expect(ScrapedPropertyModel.findOneAndUpdate).toHaveBeenCalledTimes(1);
        });

        it('stores agent email and property title on the conversation', async () => {
            await service.getOrCreateConversation(makeShadowDto());

            expect(ConversationModel.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    agentEmail: 'agent@smithco.com',
                    propertyTitle: '2 Bed Flat in Shoreditch',
                }),
            );
        });
    });

    // -----------------------------------------------------------------------
    describe('Shadow conversation WITHOUT snapshot', () => {
        it('does not upsert to scraped_properties if no snapshot provided', async () => {
            await service.getOrCreateConversation(makeShadowDto({ scrapedPropertySnapshot: undefined }));

            expect(ScrapedPropertyModel.findOneAndUpdate).not.toHaveBeenCalled();
        });
    });

    // -----------------------------------------------------------------------
    describe('Native property conversation', () => {
        it('does not touch scraped_properties for a native property', async () => {
            await service.getOrCreateConversation(makeNativeDto());

            expect(ScrapedPropertyModel.findOneAndUpdate).not.toHaveBeenCalled();
        });

        it('creates a landlord participant for native conversations', async () => {
            await service.getOrCreateConversation(makeNativeDto());

            const calls = (ConversationParticipantModel.create as jest.Mock).mock.calls;
            const roles = calls.map((c: any) => c[0].role);
            expect(roles).toContain('landlord');
            expect(roles).toContain('tenant');
        });

        it('uses the provided propertyId without modification', async () => {
            await service.getOrCreateConversation(makeNativeDto());

            expect(ConversationModel.create).toHaveBeenCalledWith(
                expect.objectContaining({ propertyId: 'native-prop-uuid-001' }),
            );
        });
    });
});

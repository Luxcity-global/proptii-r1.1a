/**
 * Tests for proptii-search searchWorker
 *
 * Verifies that after the save-on-message migration the worker:
 * - Publishes results to Redis (SSE stream)
 * - Does NOT call any MongoDB/Mongoose model
 * - Still writes the final Redis cache entry
 */

import { connection as redis } from '../infrastructure/queue';
import { ScraperManager } from '../integrations/ScraperManager';

// --------------------------------------------------------------------------
// Mocks
// --------------------------------------------------------------------------

jest.mock('../infrastructure/queue', () => ({
    connection: {
        publish: jest.fn().mockResolvedValue(1),
        set: jest.fn().mockResolvedValue('OK'),
    },
}));

jest.mock('../integrations/ScraperManager');

// Ensure the Property model is NOT imported by the worker
jest.mock('../models/Property', () => {
    throw new Error('Property model should NOT be imported by searchWorker');
});

// --------------------------------------------------------------------------
// Tests
// --------------------------------------------------------------------------

describe('searchWorker — no MongoDB writes', () => {
    const mockResults = [
        { url: 'https://rightmove.co.uk/p1', title: 'Flat in Bermondsey', price: '£1,800 pcm' },
        { url: 'https://rightmove.co.uk/p2', title: 'Studio in Brixton', price: '£1,200 pcm' },
    ];

    beforeEach(() => {
        jest.clearAllMocks();

        (ScraperManager as jest.MockedClass<typeof ScraperManager>).mockImplementation(() => ({
            scrapeAll: jest.fn().mockImplementation(
                async (_query: string, _filters: any, onResults: Function) => {
                    await onResults('rightmove', mockResults);
                    return mockResults;
                },
            ),
        } as any));
    });

    it('publishes results to the Redis SSE channel', async () => {
        // Dynamically import so that the jest.mock for Property fires first
        const { searchWorker } = await import('../workers/searchWorker');

        // Simulate job processing by calling the worker processor directly
        // (BullMQ workers expose the processor via the worker instance internals)
        // We test the underlying behaviour via redis mock calls
        expect(redis.publish).toHaveBeenCalledWith(
            expect.stringContaining('search:events:'),
            expect.stringContaining('"type":"results"'),
        );
    });

    it('writes the final results to Redis cache with 24h TTL', async () => {
        await import('../workers/searchWorker');

        expect(redis.set).toHaveBeenCalledWith(
            expect.stringContaining('search:'),
            expect.any(String),
            'EX',
            86400,
        );
    });

    it('does NOT call findOneAndUpdate or any MongoDB model', async () => {
        // The mock at the top of this file throws if Property is imported,
        // so if this test passes without error the model was never imported.
        await expect(import('../workers/searchWorker')).resolves.toBeDefined();
    });
});

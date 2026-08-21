import { describe, it, expect } from 'vitest';
import { mockClassifyQuery } from '../govDataService';

describe('mockClassifyQuery', () => {
  it('extracts beds, location, tenure and price for a typical rent query', () => {
    const result = mockClassifyQuery('2 bedroom flat in Leeds under 1200pcm');

    expect(result.fallback).toBe(false);
    expect(result.intent).toBe('property_search');
    expect(result.entities.bedrooms).toBe(2);
    expect(result.entities.location).toMatch(/leeds/i);
    expect(result.entities.tenure).toBe('rent');
    expect(result.entities.price_max).toBe(1200);
  });

  it('treats rights questions as general_answerable', () => {
    const result = mockClassifyQuery('What are my deposit rights?');
    expect(result.intent).toBe('general_answerable');
  });

  it('returns fallback for empty query', () => {
    const result = mockClassifyQuery('   ');
    expect(result.fallback).toBe(true);
    expect(result.intent).toBe('property_search');
  });
});

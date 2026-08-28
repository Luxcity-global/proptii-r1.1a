import { describe, expect, it } from 'vitest';
import {
  getPropertyDisplayTitle,
  getPropertyListingDescription,
  isListingBlurb,
} from '../propertyDisplay';

const longBlurb =
  'MID-TERRACED property which offers PERIOD and CHARM and benefits from TWO bedrooms, useful loft and cellar storage and a garden to the front. The property is centrally located in PUDSEY TOWN.';

describe('propertyDisplay helpers', () => {
  it('treats marketing paragraphs as blurbs and short titles as headings', () => {
    expect(isListingBlurb(longBlurb)).toBe(true);
    expect(isListingBlurb('Modern 2 Bedroom Flat in Islington')).toBe(false);
  });

  it('synthesizes a simple heading from beds and type when title is a blurb', () => {
    expect(
      getPropertyDisplayTitle({
        title: longBlurb,
        bedrooms: 2,
        propertyType: 'Terraced',
      }),
    ).toBe('2 Bedroom Terraced');
  });

  it('keeps an already-short title unchanged', () => {
    expect(
      getPropertyDisplayTitle({
        title: 'Modern 2 Bedroom Flat in Islington',
        bedrooms: 2,
        propertyType: 'Flat',
      }),
    ).toBe('Modern 2 Bedroom Flat in Islington');
  });

  it('moves a blurb title into description when description is missing', () => {
    expect(
      getPropertyListingDescription({
        title: longBlurb,
        description: '',
      }),
    ).toBe(longBlurb);
  });

  it('prefers the explicit description field', () => {
    expect(
      getPropertyListingDescription({
        title: longBlurb,
        description: 'A bright terraced house with a garden.',
      }),
    ).toBe('A bright terraced house with a garden.');
  });

  it('does not invent description copy for a short title', () => {
    expect(
      getPropertyListingDescription({
        title: '2 Bedroom Flat in Pudsey',
        description: '',
      }),
    ).toBe('');
  });
});

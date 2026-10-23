import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePropertyDto, UpdatePropertyDto } from './property.dto';

describe('Property DTO Validation (Task p4-4)', () => {
  it('passes for a valid property creation payload', async () => {
    const raw = {
      title: 'Luxury 2-Bed Flat',
      address: '10 Downing St',
      city: 'London',
      postcode: 'SW1A 2AA',
      price: 2500,
      bedrooms: 2,
      bathrooms: 1,
      status: 'vacant',
    };

    const dto = plainToInstance(CreatePropertyDto, raw);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('rejects creation when price is negative or zero', async () => {
    const raw = {
      title: 'Luxury 2-Bed Flat',
      address: '10 Downing St',
      postcode: 'SW1A 2AA',
      price: -500,
    };

    const dto = plainToInstance(CreatePropertyDto, raw);
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const priceErr = errors.find(e => e.property === 'price');
    expect(priceErr).toBeDefined();
    expect(priceErr?.constraints?.isPositive).toBeDefined();
  });

  it('rejects creation when address or postcode is missing', async () => {
    const raw = {
      title: 'Flat without address',
      price: 1500,
    };

    const dto = plainToInstance(CreatePropertyDto, raw);
    const errors = await validate(dto);
    const addressErr = errors.find(e => e.property === 'address');
    const postcodeErr = errors.find(e => e.property === 'postcode');
    expect(addressErr).toBeDefined();
    expect(postcodeErr).toBeDefined();
  });

  it('validates partial updates in UpdatePropertyDto', async () => {
    const raw = {
      price: 2800,
      status: 'occupied',
    };

    const dto = plainToInstance(UpdatePropertyDto, raw);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });
});

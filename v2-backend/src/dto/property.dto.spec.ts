import { describe, it, expect } from 'vitest';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreatePropertyDto, UpdatePropertyDto } from './property.dto';
import { CreateTenantDto } from './create-tenant.dto';

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
      userId: 'user-123',
      defaultRiskScore: 75,
    };

    const dto = plainToInstance(UpdatePropertyDto, raw);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.length).toBe(0);
  });

  it('automatically extracts UK postcode from address when postcode is not passed separately', async () => {
    const raw = {
      title: 'Apartment in Camden',
      address: '25 Camden High Street, London NW1 7JE',
      price: '£2,400 pcm',
      rent: 2400,
      type: 'Flat',
      documents: [],
      archived: false,
      isArchived: false,
    };

    const dto = plainToInstance(CreatePropertyDto, raw);
    const errors = await validate(dto);
    if (errors.length > 0) {
      console.log('Validation errors:', JSON.stringify(errors, null, 2));
    }
    expect(errors.length).toBe(0);
    expect(dto.postcode).toBe('NW1 7JE');
    expect(dto.price).toBe(2400);
  });

  it('whitelists userId and defaultRiskScore in CreatePropertyDto without forbidNonWhitelisted errors', async () => {
    const raw = {
      title: 'Modern Flat',
      address: '15 High St, London E1 6AN',
      price: 2000,
      userId: 'owner_user_456',
      ownerEmail: 'landlord@test.com',
      defaultRiskScore: 75,
    };

    const dto = plainToInstance(CreatePropertyDto, raw);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.length).toBe(0);
  });

  it('whitelists userId and defaultRiskScore in CreateTenantDto without forbidNonWhitelisted errors', async () => {
    const raw = {
      name: 'John Smith',
      email: 'john@example.com',
      propertyId: 'prop-123',
      rentAmount: 1800,
      userId: 'owner_user_456',
      defaultRiskScore: 75,
    };

    const dto = plainToInstance(CreateTenantDto, raw);
    const errors = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    expect(errors.length).toBe(0);
  });
});

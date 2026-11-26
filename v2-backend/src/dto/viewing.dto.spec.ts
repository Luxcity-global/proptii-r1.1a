import { describe, it, expect } from 'vitest';
import { ValidationPipe } from '@nestjs/common';
import { CreateViewingDto, UpdateViewingStatusDto } from './viewing.dto';

const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});

describe('Viewing DTO Validation', () => {
  it('accepts the RequestViewingModal / saveViewingBooking payload with null optional IDs', async () => {
    const raw = {
      userId: 'tenant-uid-123',
      propertyId: null,
      landlordId: null,
      agentId: null,
      agentEmail: 'agent@example.com',
      tenantEmail: 'udu0032000@gmail.com',
      propertyTitle: '42 Grey Street, NEWCASTLE UPON TYNE, NZ1 ZAE',
      requestedDate: '2026-11-25',
      requestedTime: '14:00',
      notes: 'Afternoon works best',
      property: {
        street: '42 Grey Street',
        town: 'NEWCASTLE UPON TYNE',
        city: '',
        postcode: 'NZ1 ZAE',
        agent: {
          id: '',
          name: '',
          email: 'agent@example.com',
          phone: '',
          company: '',
        },
      },
      viewingDetails: {
        date: '2026-11-25',
        time: '14:00',
        preference: 'In-Person Viewing',
        userDetails: {
          fullName: 'Godwin Udu',
          email: 'udu0032000@gmail.com',
          phoneNumber: '',
        },
      },
      status: 'pending',
    };

    const result = await pipe.transform(raw, { type: 'body', metatype: CreateViewingDto });
    expect(result).toBeInstanceOf(CreateViewingDto);
    expect(result.userId).toBe('tenant-uid-123');
    expect(result.agentEmail).toBe('agent@example.com');
    expect(result.tenantEmail).toBe('udu0032000@gmail.com');
    expect(result.property?.street).toBe('42 Grey Street');
    expect(result.status).toBe('pending');
  });

  it('accepts the bookViewingRequestService.saveRequest payload', async () => {
    const raw = {
      userId: 'tenant-uid-123',
      propertyId: 'prop-123',
      landlordId: 'll-123',
      agentId: 'ag-123',
      agentEmail: 'agent@example.com',
      property: {
        street: '10 Downing St',
        city: 'London',
        postcode: 'SW1A 2AA',
        agent: { id: 'ag-123', name: 'Agent', email: 'agent@example.com', phone: '', company: '' },
      },
      propertyTitle: '10 Downing St, SW1A 2AA',
      requestedDate: '2026-11-26',
      requestedTime: '10:00',
      viewingDetails: { date: '2026-11-26', time: '10:00', preference: 'Virtual Viewing' },
      status: 'requested',
    };

    const result = await pipe.transform(raw, { type: 'body', metatype: CreateViewingDto });
    expect(result.status).toBe('requested');
    expect(result.landlordId).toBe('ll-123');
  });

  it('accepts the legacy bookingService.scheduleViewing payload', async () => {
    const raw = {
      property: { street: '10 High St', city: 'Manchester', postcode: 'M1 1AE' },
      agent: { name: 'Jane', email: 'jane@agency.co.uk', phone: '0161', company: 'Agency' },
      viewing_date: '2026-11-27',
      viewing_time: '16:00',
      preference: 'In-Person Viewing',
      whatsappNumber: '+447700900000',
      status: 'PENDING',
    };

    const result = await pipe.transform(raw, { type: 'body', metatype: CreateViewingDto });
    expect(result.viewing_date).toBe('2026-11-27');
    expect(result.agent?.email).toBe('jane@agency.co.uk');
  });

  it('still rejects unknown non-whitelisted properties', async () => {
    await expect(
      pipe.transform(
        { propertyTitle: '42 Grey Street', unexpectedInjectedField: 'nope' },
        { type: 'body', metatype: CreateViewingDto },
      ),
    ).rejects.toThrow();
  });

  it('accepts UpdateViewingStatusDto payloads', async () => {
    const result = await pipe.transform(
      { status: 'confirmed', notes: 'See you there', agentNotes: 'Bring ID' },
      { type: 'body', metatype: UpdateViewingStatusDto },
    );
    expect(result.status).toBe('confirmed');
    expect(result.agentNotes).toBe('Bring ID');
  });
});

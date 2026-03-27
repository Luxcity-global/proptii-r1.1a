# Viewing Firestore Integration

This document outlines the complete integration of Firestore functionality for the BookViewingModal and Viewings dashboard section.

## What Was Implemented

### 1. Firestore Service for Viewing Bookings (`src/services/viewingService.ts`)

**Features:**
- Complete CRUD operations for viewing bookings
- Real-time subscriptions for live updates
- Status management (pending, confirmed, completed, cancelled, rescheduled)
- Statistics calculation
- Error handling and offline support

**Key Methods:**
- `saveViewingBooking()` - Save new viewing requests
- `getUserViewingBookings()` - Get all bookings for a user
- `getViewingBookingsByStatus()` - Filter by status
- `updateViewingStatus()` - Change booking status
- `getViewingStats()` - Calculate statistics
- `subscribeToUserViewingBookings()` - Real-time updates
- `subscribeToViewingStats()` - Real-time stats updates

### 2. Updated BookViewingModal (`src/components/viewings/BookViewingModal.tsx`)

**Changes:**
- Added Firestore integration alongside existing backend
- Saves viewing bookings to Firestore when submitted
- Maintains backward compatibility with existing booking service
- Enhanced error handling for Firestore operations

**Data Flow:**
1. User fills out viewing form
2. Data saved to Firestore (new)
3. Data saved to existing backend (backward compatibility)
4. Emails sent to agent and user
5. Success confirmation shown

### 3. Updated Viewings Dashboard (`src/components/dashboard/sections/Viewings-new.tsx`)

**Features:**
- Real-time data loading from Firestore
- Dynamic statistics cards
- Live tab counts (upcoming/past viewings)
- Status-based filtering
- Action buttons for each viewing
- Loading states and error handling
- Empty state handling

**Real-time Features:**
- Automatic updates when new viewings are booked
- Live status changes (pending → confirmed → completed)
- Real-time statistics updates
- No page refresh needed

## Data Structure

### ViewingBooking Interface
```typescript
interface ViewingBooking {
  id: string;
  userId: string;
  propertyId?: string;
  property: {
    street: string;
    town: string;
    city: string;
    postcode: string;
    agent: {
      id: string;
      name: string;
      email: string;
      phone: string;
      company: string;
    };
  };
  viewingDetails: {
    date: string;
    time: string;
    preference: string;
    userDetails: {
      fullName: string;
      email: string;
      phoneNumber: string;
    };
  };
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  confirmedAt?: Timestamp;
  completedAt?: Timestamp;
  cancelledAt?: Timestamp;
  rescheduledAt?: Timestamp;
  notes?: string;
  agentNotes?: string;
}
```

## Firestore Collection Structure

```
viewingBookings/
├── {userId}_{timestamp}_{random}/
│   ├── id: string
│   ├── userId: string
│   ├── propertyId?: string
│   ├── property: object
│   ├── viewingDetails: object
│   ├── status: string
│   ├── createdAt: Timestamp
│   ├── updatedAt: Timestamp
│   └── [status-specific timestamps]
```

## Real-time Features

### Automatic Updates
- **New bookings**: Appear immediately in "Upcoming" tab
- **Status changes**: Update in real-time across all views
- **Statistics**: Live count updates in summary cards
- **Tab counts**: Dynamic numbers in tab buttons

### Status Flow
1. **pending** → User submits viewing request
2. **confirmed** → Agent confirms the viewing
3. **completed** → Viewing has taken place
4. **cancelled** → Viewing cancelled by user/agent
5. **rescheduled** → Viewing moved to different time

## Error Handling

### Offline Support
- Graceful degradation when offline
- Data cached locally when possible
- Automatic retry when connection restored

### Firestore Errors
- Permission denied → Clear error messages
- Network unavailable → Offline indicators
- Invalid data → Validation errors

## Usage Examples

### Booking a Viewing
```typescript
// In BookViewingModal
const result = await viewingService.saveViewingBooking(
  user.id,
  property,
  viewingDetails,
  propertyId
);
```

### Getting User Viewings
```typescript
// In Viewings component
const { bookings } = await viewingService.getUserViewingBookings(userId);
```

### Real-time Updates
```typescript
// Subscribe to live updates
const unsubscribe = viewingService.subscribeToUserViewingBookings(
  userId,
  (bookings) => setViewings(bookings),
  (error) => console.error(error)
);
```

## Integration Points

### With Existing System
- **Backward Compatible**: Existing booking service still works
- **Dual Storage**: Saves to both Firestore and existing backend
- **Email Integration**: Maintains existing email functionality
- **UI Consistency**: Uses existing design patterns

### With Authentication
- **User Context**: Integrates with existing AuthContext
- **User ID**: Uses authenticated user ID for data isolation
- **Security**: User can only see their own viewings

## Benefits

### For Users
- **Real-time Updates**: No need to refresh page
- **Better UX**: Immediate feedback on actions
- **Reliable Data**: Firestore provides consistent data access
- **Offline Support**: Works even when connection is poor

### For Developers
- **Type Safety**: Full TypeScript interfaces
- **Error Handling**: Comprehensive error management
- **Scalability**: Firestore handles large datasets efficiently
- **Real-time**: Built-in real-time capabilities

## Next Steps

### Immediate
1. Test the integration with real data
2. Add "Request Viewing" button functionality
3. Implement reschedule/cancel actions
4. Add property image handling

### Future Enhancements
1. **Agent Dashboard**: Let agents manage viewings
2. **Notifications**: Push notifications for status changes
3. **Calendar Integration**: Sync with user calendars
4. **Analytics**: Track viewing conversion rates
5. **Mobile App**: Extend to mobile applications

## Testing

### Manual Testing
1. Book a viewing through the modal
2. Check Firestore console for saved data
3. Verify real-time updates in dashboard
4. Test status changes and cancellations
5. Test offline/online scenarios

### Automated Testing
- Unit tests for viewingService methods
- Integration tests for modal submission
- E2E tests for complete user flow
- Performance tests for real-time updates

## Security Considerations

### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /viewingBookings/{document} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### Data Privacy
- User data isolated by userId
- No cross-user data access
- Secure authentication required
- Audit trail for all changes

This integration provides a robust, real-time viewing management system that enhances the user experience while maintaining compatibility with existing systems.

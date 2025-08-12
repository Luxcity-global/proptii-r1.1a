# Viewings Cancel & Reschedule Flow Documentation

## Overview
This document outlines the implementation of the cancel and reschedule viewing flows in the Proptii dashboard. These features allow tenants to cancel or reschedule their upcoming property viewings with proper confirmation and notification flows.

## Table of Contents
1. [Implemented Features](#implemented-features)
2. [Technical Implementation](#technical-implementation)
3. [User Flow Diagrams](#user-flow-diagrams)
4. [What's Left To Do](#whats-left-to-do)
5. [API Integration Points](#api-integration-points)
6. [Testing Considerations](#testing-considerations)

## Implemented Features

### ✅ Cancel Viewing Flow
- **Cancel Confirmation Modal**
  - Property details display (address, current date/time)
  - Estate agent information (name, email)
  - Optional cancellation reason text area (200 character limit)
  - Auto-expanding text area with character counter
  - Orange "Cancel Viewing" button (#DC5F12)

- **Success Confirmation Modal**
  - Confirmation message that viewing has been cancelled
  - Notification that estate agent has been informed
  - "Find Property" button that navigates to home page
  - "Close" button to dismiss modal

### ✅ Reschedule Viewing Flow
- **Reschedule Request Modal**
  - Property details display (address, current date/time)
  - Estate agent information (name, email)
  - Date picker (prevents past date selection)
  - Time picker (24-hour format)
  - Weekend detection (ready for agent availability integration)
  - Optional reschedule reason text area (200 character limit)
  - Auto-expanding text area with character counter
  - "Request Reschedule" button (disabled until date/time selected)

- **Reschedule Success Modal**
  - Confirmation that reschedule request has been sent
  - Message that agent will contact to confirm new time
  - "Close" button to dismiss modal

### ✅ Additional Features
- **Cancelled Viewings Tab**
  - New tab in viewings section showing cancelled viewings
  - Cancelled viewings card with count display
  - Integration with existing tab system
  - Mock data for testing (2 cancelled viewings)

## Technical Implementation

### Files Modified
1. **`src/components/dashboard/sections/Viewings.tsx`**
   - Added modal state management
   - Implemented cancel and reschedule modals
   - Added form validation and handling
   - Integrated with navigation system

2. **`src/hooks/useDashboardData.ts`**
   - Added `cancelledViewings` filter
   - Updated return object to include cancelled viewings

3. **`src/mocks/dashboardApi.ts`**
   - Added mock cancelled viewings data
   - 2 example cancelled viewings for testing

### State Management
```typescript
// Cancel flow states
const [cancelModalOpen, setCancelModalOpen] = useState(false);
const [successModalOpen, setSuccessModalOpen] = useState(false);
const [selectedViewing, setSelectedViewing] = useState<any>(null);
const [cancellationReason, setCancellationReason] = useState('');

// Reschedule flow states
const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
const [rescheduleSuccessModalOpen, setRescheduleSuccessModalOpen] = useState(false);
const [rescheduleDate, setRescheduleDate] = useState('');
const [rescheduleTime, setRescheduleTime] = useState('');
const [rescheduleReason, setRescheduleReason] = useState('');
```

### Validation Rules
- **Date Validation**: Cannot select past dates
- **Weekend Detection**: Logs when weekends are selected (ready for agent availability)
- **Required Fields**: Date and time must be selected for reschedule
- **Character Limits**: 200 characters for reason text areas

### Styling
- Consistent orange color scheme (#DC5F12)
- Auto-expanding text areas with proper padding
- Material-UI Dialog components
- Responsive design patterns

## User Flow Diagrams

### Cancel Viewing Flow
```
User clicks "Cancel Viewing" 
    ↓
Cancel Confirmation Modal opens
    ↓
User can enter optional reason
    ↓
User clicks "Cancel Viewing"
    ↓
Success Modal opens
    ↓
User can click "Find Property" or "Close"
```

### Reschedule Viewing Flow
```
User clicks "Reschedule"
    ↓
Reschedule Request Modal opens
    ↓
User selects new date and time
    ↓
User can enter optional reason
    ↓
User clicks "Request Reschedule"
    ↓
Success Modal opens
    ↓
User clicks "Close"
```

## What's Left To Do

### 🔴 High Priority
1. **API Integration**
   - Replace placeholder logic in `handleConfirmCancel()` with actual API calls
   - Replace placeholder logic in `handleConfirmReschedule()` with actual API calls
   - Implement proper error handling for API failures
   - Add loading states during API calls

2. **Email Notifications**
   - Send cancellation emails to estate agents
   - Send reschedule request emails to estate agents
   - Include cancellation/reschedule reasons in emails
   - Add email templates for both flows

3. **Real Property Data**
   - Replace mock property data with real property information
   - Integrate with property management system
   - Add property images and details
   - Link to actual property listings

### 🟡 Medium Priority
4. **Agent Availability Integration**
   - Integrate with agent calendar systems
   - Show available time slots for rescheduling
   - Prevent booking on unavailable dates/times
   - Add agent availability warnings for weekends

5. **Enhanced Validation**
   - Add minimum notice period validation
   - Implement business hours validation
   - Add agent-specific availability rules
   - Validate against property availability

6. **Real-time Updates**
   - Refresh viewing list after cancellation/reschedule
   - Update viewing status in real-time
   - Add optimistic updates for better UX
   - Implement proper state management

### 🟢 Low Priority
7. **Additional Features**
   - Add reschedule history tracking
   - Implement cancellation policy display
   - Add bulk cancellation/reschedule options
   - Create viewing analytics dashboard

8. **UI/UX Improvements**
   - Add custom styling guidance implementation
   - Improve mobile responsiveness
   - Add animations and transitions
   - Implement accessibility improvements

## API Integration Points

### Cancel Viewing API
```typescript
// TODO: Implement in handleConfirmCancel()
const cancelViewing = async (viewingId: string, reason?: string) => {
  const response = await fetch('/api/viewings/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ viewingId, reason })
  });
  return response.json();
};
```

### Reschedule Viewing API
```typescript
// TODO: Implement in handleConfirmReschedule()
const rescheduleViewing = async (
  viewingId: string, 
  newDate: string, 
  newTime: string, 
  reason?: string
) => {
  const response = await fetch('/api/viewings/reschedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ viewingId, newDate, newTime, reason })
  });
  return response.json();
};
```

### Email Service Integration
```typescript
// TODO: Implement email notifications
const sendCancellationEmail = async (agentEmail: string, viewingDetails: any, reason?: string) => {
  // Send cancellation email to agent
};

const sendRescheduleEmail = async (agentEmail: string, viewingDetails: any, newDateTime: string, reason?: string) => {
  // Send reschedule request email to agent
};
```

## Testing Considerations

### Unit Tests Needed
- Modal open/close functionality
- Form validation rules
- State management
- Navigation functionality

### Integration Tests Needed
- API integration testing
- Email notification testing
- Real property data integration
- Agent availability integration

### User Acceptance Tests
- Complete cancel flow testing
- Complete reschedule flow testing
- Error handling scenarios
- Mobile responsiveness testing

## Development Notes

### Current Limitations
- Using mock data for all viewings
- No real API integration
- No email notifications
- Limited validation rules
- No agent availability checking

### Future Considerations
- Implement proper TypeScript interfaces for viewing data
- Add comprehensive error handling
- Implement proper loading states
- Add unit and integration tests
- Consider implementing real-time updates with WebSockets

### Performance Considerations
- Optimize modal rendering
- Implement proper memoization
- Consider lazy loading for large viewing lists
- Optimize API calls and caching

---

**Last Updated**: December 2024
**Developer**: AI Assistant
**Status**: Frontend Implementation Complete, Backend Integration Pending 
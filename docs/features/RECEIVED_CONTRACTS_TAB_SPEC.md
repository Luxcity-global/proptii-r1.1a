# Received Contracts Tab - UI Specification

## Overview
The "Received Contracts" tab displays contracts sent by landlords to tenants, with the same UI structure and actions as "Uploaded Templates".

## Visual Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Uploaded Templates]  [Received Contracts ✓]  [Deleted Templates]  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Received Contracts                                                   │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │ Contract                    │ Date        │ Actions            │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ tenancy-agreement.pdf       │ 11/11/2025  │ [Manage ▼] [Preview] │ │
│  │ ┌──────┐                    │             │                    │ │
│  │ │ Sent │                    │             │                    │ │
│  │ └──────┘                    │             │                    │ │
│  │ From: landlord@test.com    │             │                    │ │
│  ├────────────────────────────────────────────────────────────────┤ │
│  │ lease-2024.pdf              │ 11/10/2025  │ [Manage ▼] [Preview] │ │
│  │ ┌─────────────────┐         │             │                    │ │
│  │ │ Awaiting Sign.  │         │             │                    │ │
│  │ └─────────────────┘         │             │                    │ │
│  │ From: agent@realty.com     │             │                    │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘

When clicking "Manage":
┌─────────────────┐
│ Customize       │
│ Download        │
└─────────────────┘
```

## Table Structure

### Columns
1. **Contract** (40% width) - Left aligned
   - Contract filename (bold)
   - Status badge (inline, below filename)
   - Landlord email (small text, below status)

2. **Date** (20% width) - Center/Left aligned
   - Sent date in format: MM/DD/YYYY

3. **Actions** (40% width) - Right aligned
   - Manage button (outlined)
   - Preview button (filled)

## Component Breakdown

### Contract Column Content
```
┌────────────────────────────┐
│ tenancy-agreement.pdf      │ ← Bold filename
│ ┌──────┐                   │
│ │ Sent │                   │ ← Status badge (inline, rounded)
│ └──────┘                   │
│ From: landlord@test.com   │ ← Landlord email (gray text, xs)
└────────────────────────────┘
```

### Status Badges

**Sent** (Blue)
```css
background: #DBEAFE (blue-100)
color: #1E40AF (blue-800)
padding: 2px 8px
border-radius: 4px
font-size: 12px
```

**Awaiting Signature** (Yellow)
```css
background: #FEF3C7 (yellow-100)
color: #92400E (yellow-800)
```

**Signed** (Green)
```css
background: #D1FAE5 (green-100)
color: #065F46 (green-800)
```

### Action Buttons

**Manage Button** (Outlined)
```css
border: 1px solid #136C9E
color: #136C9E
background: transparent
padding: 4px 16px
border-radius: 9999px (full)
hover: background #136C9E with 10% opacity
```

**Preview Button** (Filled)
```css
background: #136C9E
color: white
padding: 4px 16px
border-radius: 9999px (full)
hover: background #0F5B88
```

### Manage Dropdown Menu
```
┌─────────────────────────┐
│ Customize               │ ← Opens customization view
│ Download                │ ← Downloads PDF file
└─────────────────────────┘

Position: absolute
Width: 160px (10rem)
Background: white
Border: 1px solid gray-300
Border-radius: 6px
Box-shadow: 0 10px 15px rgba(0,0,0,0.1)
Z-index: 10
```

## Empty State

When no contracts have been received:

```
┌──────────────────────────────────────────┐
│                                          │
│              (empty icon)                │
│                                          │
│        No contracts received yet         │
│                                          │
│  Contracts sent by your landlord        │
│         will appear here                 │
│                                          │
└──────────────────────────────────────────┘

Text alignment: center
Padding: 8rem vertical
Color: gray-500
```

## Interactions

### 1. Preview Contract
**Trigger:** Click "Preview" button

**Action:**
1. Convert base64 data to blob
2. Create File object
3. Generate object URL
4. Open PDF preview modal
5. Display PDF with navigation controls

### 2. Manage → Customize
**Trigger:** Click "Manage" → "Customize"

**Action:**
1. Convert contract to Template format
2. Add to uploadedTemplates state
3. Call `handleCustomize(contract.id)`
4. Opens CustomizePage component
5. User can fill/edit the contract

### 3. Manage → Download
**Trigger:** Click "Manage" → "Download"

**Action:**
1. Create temporary link element
2. Set href to contract's base64 data URL
3. Set download attribute to filename
4. Trigger click
5. Browser downloads PDF file
6. Close dropdown menu

## Data Source

### Firestore Query
```typescript
Collection: 'contracts'
Filter: where('tenantEmail', '==', currentUserEmail)
Order: sentDate DESC
```

### Contract Object Structure
```typescript
{
  id: string;
  fileName: string;
  title: string;
  status: 'sent' | 'unsigned' | 'signed';
  tenantEmail: string;
  landlordEmail: string;
  fileUrl: string; // base64 data URL
  sentDate: Date;
  signedDate?: Date;
  expiryDate?: Date;
  propertyAddress: string;
  tenantName: string;
  contractType: string;
  additionalInfo?: string;
}
```

## Comparison: Uploaded Templates vs Received Contracts

| Feature | Uploaded Templates | Received Contracts |
|---------|-------------------|-------------------|
| **Table Columns** | Contract, Date, Actions | Contract, Date, Actions ✓ |
| **Manage Button** | Yes | Yes ✓ |
| **Preview Button** | Yes | Yes ✓ |
| **Customize Option** | Yes | Yes ✓ |
| **Delete Option** | Yes | No (Download instead) |
| **Download Option** | No (implicit) | Yes ✓ |
| **Status Badge** | No | Yes (inline) ✓ |
| **Sender Info** | No | Yes (landlord email) ✓ |
| **Data Source** | contractTemplates (uploaded by user) | contracts (sent by landlord) |

## Key Differences from Original Implementation

### Before (Your Request)
- Different table structure
- Only "View" button
- Status in separate column
- No Manage dropdown

### After (Updated)
✅ Same table structure as "Uploaded Templates"
✅ Manage dropdown with Customize & Download
✅ Preview button (renamed from "View")
✅ Status badge inline in Contract column
✅ Landlord email shown below filename
✅ Consistent UI/UX across tabs

## Implementation Files

### Modified Files
- `src/components/contract/ContractModal.tsx` (Lines 831-969)
  - Updated "Received Contracts" tab UI
  - Added Manage dropdown
  - Added Customize functionality
  - Added Download functionality

### Related Services
- `src/services/contractService.ts`
  - `getReceivedContracts(tenantEmail)`
  - `subscribeToReceivedContracts(tenantEmail, callback)`

## Testing Checklist

- [ ] Contracts sent by landlord appear in tenant's "Received Contracts" tab
- [ ] Table shows: filename, status badge, landlord email, sent date
- [ ] Manage button opens dropdown
- [ ] Customize option opens customization view
- [ ] Download option downloads PDF
- [ ] Preview button opens PDF viewer
- [ ] Empty state shows when no contracts received
- [ ] Dropdown closes when clicking outside
- [ ] Multiple contracts display correctly
- [ ] Base64 to blob conversion works
- [ ] PDF preview renders correctly

## Future Enhancements

1. **Sign Button** - Add "Sign" action in dropdown for unsigned contracts
2. **Filter by Status** - Filter dropdown (Sent/Unsigned/Signed)
3. **Search** - Search by filename or landlord email
4. **Bulk Actions** - Select multiple contracts for bulk operations
5. **Notifications** - Badge showing new contracts count
6. **Archive** - Move old contracts to archive
7. **Comments** - Add comments/notes to contracts
8. **History** - View contract status change history

## Accessibility

- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Screen reader announces status badges
- [ ] Dropdown menu accessible via keyboard
- [ ] Focus management in modals
- [ ] Color contrast meets WCAG AA standards
- [ ] Alt text for icons

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ⚠️ IE11 (base64 blob conversion may need polyfill)

## Performance Considerations

- Lazy load contracts (pagination if >50 contracts)
- Cache blob URLs to avoid re-conversion
- Debounce dropdown toggle
- Virtualize table for large datasets
- Optimize Firestore queries with indexes




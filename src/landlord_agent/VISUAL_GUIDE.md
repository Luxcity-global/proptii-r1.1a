# Visual Guide - Referencing Documents in Tenant Details

## 📸 What You'll See

### 1. Documents Tab Header

```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Documents    [5 from referencing]    [Upload Document]   │
└─────────────────────────────────────────────────────────────┘
```

- **Documents** - Tab title with file icon
- **[5 from referencing]** - Blue badge showing count of referencing documents
- **[Upload Document]** - Orange button to upload additional documents

---

### 2. Document Card (Referencing Document)

```
┌─────────────────────────────────────────────────────────────┐
│ 📄  Identity Document - passport.jpg  [Referencing]  ⋮     │
│     Uploaded: 7 Nov 2025                              [valid]│
│     Size: 245.67 KB • Type: image/jpeg                      │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **📄** File icon (orange)
- **Document Name** - Shows type and original filename
- **[Referencing]** - Blue badge indicating it's from referencing
- **⋮** - Three-dot menu for actions
- **[valid]** - Green badge for status
- **Upload Date** - When document was uploaded
- **File Info** - Size and type

---

### 3. Action Menu (When clicking ⋮)

```
┌─────────────────────────┐
│ 📄 View Document        │
│ 📄 Download             │
└─────────────────────────┘
```

**Actions:**
- **View Document** - Opens in new browser tab
- **Download** - Downloads to device

---

### 4. Loading State

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│               🔄 Loading documents...                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

Shows spinner while fetching referencing data from Firestore.

---

### 5. Empty State (No Documents)

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                        📄                                     │
│                                                               │
│              No documents available                           │
│                                                               │
│    Upload documents or have the tenant complete referencing   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

Shows when tenant has no documents.

---

### 6. Complete Documents List Example

```
┌─────────────────────────────────────────────────────────────┐
│ 📄 Documents    [5 from referencing]    [Upload Document]   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📄  Identity Document - passport.jpg  [Referencing] ⋮│   │
│ │     Uploaded: 7 Nov 2025                       [valid]│   │
│ │     Size: 245.67 KB • Type: image/jpeg               │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📄  Employment Proof - payslip.pdf  [Referencing]  ⋮ │   │
│ │     Uploaded: 7 Nov 2025                       [valid]│   │
│ │     Size: 187.23 KB • Type: application/pdf          │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📄  Proof of Address - utility_bill.jpg [Referencing]⋮│   │
│ │     Uploaded: 7 Nov 2025                       [valid]│   │
│ │     Size: 312.45 KB • Type: image/jpeg               │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📄  Proof of Income - bank_statement.pdf [Referencing]⋮│   │
│ │     Uploaded: 7 Nov 2025                       [valid]│   │
│ │     Size: 428.91 KB • Type: application/pdf          │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📄  Guarantor ID - id_card.jpg  [Referencing]       ⋮│   │
│ │     Uploaded: 7 Nov 2025                       [valid]│   │
│ │     Size: 198.76 KB • Type: image/jpeg               │   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📄  Tenancy Agreement - Signed                      ⋮ │   │
│ │     Uploaded: 15 Jan 2024                      [valid]│   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
│ ┌───────────────────────────────────────────────────────┐   │
│ │ 📄  Deposit Protection Certificate                  ⋮ │   │
│ │     Uploaded: 15 Jan 2024                      [valid]│   │
│ └───────────────────────────────────────────────────────┘   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

Shows mix of referencing documents (with blue badges) and regular documents.

---

## 🎨 Color Scheme

### Badges

| Badge Type | Color | Example |
|-----------|-------|---------|
| Referencing | Blue (`bg-blue-100 text-blue-800`) | [Referencing] |
| Valid | Green (`bg-green-100 text-green-800`) | [valid] |
| Expired | Red (`bg-red-100 text-red-800`) | [expired] |
| Pending | Blue (`bg-blue-100 text-blue-800`) | [pending] |

### Icons

| Icon | Color | Usage |
|------|-------|-------|
| File Icon | Orange (`#DC5F12`) | All documents |
| Action Icons | Orange (`#DC5F12`) | Menu items |
| Loading Spinner | Gray | Loading state |

---

## 📱 Mobile View

### Stacked Layout

```
┌─────────────────────┐
│ 📄 Documents        │
│ [3 from referencing]│
│ [Upload Document]   │
├─────────────────────┤
│                     │
│ ┌─────────────────┐ │
│ │ 📄 Identity...  │ │
│ │ [Referencing]   │ │
│ │ Uploaded: 7 Nov │ │
│ │ 245.67 KB       │ │
│ │         [valid] │ │
│ └─────────────────┘ │
│                     │
│ ┌─────────────────┐ │
│ │ 📄 Employment.. │ │
│ │ [Referencing]   │ │
│ │ Uploaded: 7 Nov │ │
│ │ 187.23 KB       │ │
│ │         [valid] │ │
│ └─────────────────┘ │
│                     │
└─────────────────────┘
```

- Responsive layout
- Touch-friendly buttons
- Readable on small screens

---

## 🖱️ Interactions

### Hover States

1. **Document Card Hover**
   - Card shadow increases
   - Subtle transition effect

2. **Button Hover**
   - Upload button: Orange → Brighter Orange
   - Menu button: Gray → Light Gray

3. **Menu Item Hover**
   - Background changes to light gray
   - Text remains readable

### Click Actions

1. **Three-dot Menu Click**
   - Menu opens with options
   - Click outside to close

2. **View Document Click**
   - Opens new browser tab
   - Document loads in tab

3. **Download Click**
   - Browser download starts
   - File saves to downloads folder

---

## 🔍 Document Type Icons

All documents use the same file icon (📄) but are distinguished by:
- Document name prefix (e.g., "Identity Document -")
- [Referencing] badge
- File type in details

### Document Name Prefixes

| Document Type | Prefix |
|--------------|--------|
| Identity | `Identity Document - ` |
| Employment | `Employment Proof - ` |
| Residential | `Proof of Address - ` |
| Financial | `Proof of Income - ` |
| Guarantor | `Guarantor ID - ` |

---

## 📏 Layout Measurements

### Desktop
- **Card Width:** Full width of container
- **Card Padding:** 16px
- **Gap Between Cards:** 16px
- **Icon Size:** 20px (w-5 h-5)
- **Badge Height:** ~24px
- **Font Sizes:**
  - Document name: 14px (medium weight)
  - Details: 12px (muted)
  - Badges: 12px

### Mobile
- **Card Width:** Full width
- **Card Padding:** 12px
- **Gap Between Cards:** 12px
- **Touch Target Size:** ≥44px

---

## ✨ Visual Highlights

### What Makes Referencing Documents Stand Out?

1. **[Referencing] Badge**
   - Bright blue color
   - Easy to spot
   - Consistent placement

2. **Rich File Information**
   - Size and type shown
   - Not available for regular documents
   - Professional appearance

3. **Document Count in Header**
   - Shows total referencing docs
   - At-a-glance information

4. **Grouped Display**
   - All referencing docs appear together
   - Followed by regular documents
   - Logical organization

---

## 🎭 States Overview

| State | Visual | User Action |
|-------|--------|-------------|
| Loading | Spinner + "Loading documents..." | Wait |
| Empty | Large icon + message | Upload or complete referencing |
| Populated | Document cards list | View, download documents |
| Hover | Card shadow increase | Click to open menu |
| Menu Open | Dropdown with options | Select action |

---

## 🚦 Status Indicators

### Document Status Badges

```
[valid]    - Green badge, document is valid
[expired]  - Red badge, document has expired
[pending]  - Blue badge, awaiting verification
```

### Loading Indicators

```
🔄 Loading...         - Spinner animation
[Checking...]         - In referencing badge
```

---

## 📋 Before & After

### BEFORE (Mock Documents Only)

```
┌─────────────────────────────────────────┐
│ 📄 Documents      [Upload Document]     │
├─────────────────────────────────────────┤
│ 📄 Tenancy Agreement - Signed   [valid] │
│ 📄 Deposit Protection...        [valid] │
│ 📄 Right to Rent Check          [valid] │
└─────────────────────────────────────────┘
```

### AFTER (With Referencing Documents)

```
┌───────────────────────────────────────────────┐
│ 📄 Documents [5 from referencing] [Upload...] │
├───────────────────────────────────────────────┤
│ 📄 Identity... [Referencing] [valid] ⋮        │
│    245.67 KB • image/jpeg                     │
│                                               │
│ 📄 Employment... [Referencing] [valid] ⋮      │
│    187.23 KB • application/pdf                │
│                                               │
│ 📄 Proof of Address... [Referencing] [valid] ⋮│
│    312.45 KB • image/jpeg                     │
│                                               │
│ 📄 Proof of Income... [Referencing] [valid] ⋮ │
│    428.91 KB • application/pdf                │
│                                               │
│ 📄 Guarantor ID... [Referencing] [valid] ⋮    │
│    198.76 KB • image/jpeg                     │
│                                               │
│ 📄 Tenancy Agreement - Signed [valid] ⋮       │
│ 📄 Deposit Protection... [valid] ⋮            │
│ 📄 Right to Rent Check [valid] ⋮              │
└───────────────────────────────────────────────┘
```

**Key Improvements:**
- ✅ Shows referencing documents
- ✅ Clear labeling with badges
- ✅ File information visible
- ✅ Action menus available
- ✅ Professional appearance

---

## 🎯 User Experience Flow

```
1. Click "Clients" → 2. Select Tenant → 3. Click "Documents" Tab
                                                    ↓
                                            4. See Loading State
                                                    ↓
                                       5. Documents Load and Display
                                                    ↓
                              6. Click ⋮ Menu → Choose Action
                                     ↓                    ↓
                            7a. View (New Tab)    7b. Download (Save File)
```

---

This visual guide shows exactly what users will see when viewing tenant documents in the landlord/agent dashboard!






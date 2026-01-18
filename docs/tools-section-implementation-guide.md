# Tools Section Implementation Guide

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [File Structure](#file-structure)
4. [Dependencies](#dependencies)
5. [Step-by-Step Implementation](#step-by-step-implementation)
6. [Component Breakdown](#component-breakdown)
7. [Data Structures](#data-structures)
8. [Routing Setup](#routing-setup)
9. [Styling Approach](#styling-approach)
10. [SEO Implementation](#seo-implementation)
11. [Features & Functionality](#features--functionality)
12. [Testing & Deployment](#testing--deployment)

---

## Overview

### Purpose
The Tools Section is a comprehensive suite of interactive, client-side tools designed to help UK tenants navigate the rental application process. It provides:

- **Interactive Tools**: 6 different tools for various aspects of the rental journey
- **Document Downloads**: Access to official UK government rental documents
- **No Backend Required**: All tools run entirely in the browser
- **No User Accounts**: Completely free and accessible without signup
- **SEO Optimized**: Full structured data and meta tag optimization

### Key Features
- Tab-based navigation (Interactive Tools / Rental Documents)
- URL hash support for direct linking to document tab
- Responsive design (mobile, tablet, desktop)
- Client-side state management
- PDF generation capabilities
- Structured data (JSON-LD) for SEO
- Accessibility features (ARIA labels, semantic HTML)

---

## Architecture

### Technology Stack
- **Framework**: React 18+ with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **PDF Generation**: jsPDF
- **SEO**: React Helmet Async
- **Build Tool**: Vite

### Component Hierarchy
```
App
└── Tools (Main Page)
    ├── Tab Navigation
    ├── Tools Grid (Interactive Tools Tab)
    │   ├── ReadinessChecker
    │   ├── DocumentTracker
    │   ├── ViewingTracker
    │   ├── ProcessSimulator
    │   ├── TimelineGenerator
    │   └── KnowYourRights
    └── RentalDocuments (Documents Tab)
```

### State Management
- **Local State**: React `useState` hooks for component-level state
- **URL State**: Hash-based navigation for tab switching
- **No Global State**: Each tool manages its own state independently

---

## File Structure

```
src/
├── pages/
│   ├── Tools.tsx                    # Main tools page with tabs
│   └── tools/
│       ├── ReadinessChecker.tsx     # Rental readiness assessment tool
│       ├── DocumentTracker.tsx      # Document checklist tracker
│       ├── ViewingTracker.tsx       # Property viewing organizer
│       ├── ProcessSimulator.tsx     # Application process walkthrough
│       ├── TimelineGenerator.tsx    # Timeline estimation tool
│       ├── KnowYourRights.tsx       # Interactive tenant rights guide
│       └── RentalDocuments.tsx      # Document download section
├── components/
│   └── SEO.tsx                      # SEO component (shared)
└── App.tsx                          # Route definitions

public/
└── rental_documents/                # PDF/DOCX files for download
    ├── DLUHC_How_to_rent_Oct2023.pdf
    ├── Right to Rent Checks_ A guide to immigration documents for tenants and landlords.pdf
    ├── 3286 Home Office Right to Rent User Guide Easy Read v3.pdf
    ├── 1tds-ew-custodial-prescribed-information-template.docx
    └── legionella_Risk_Assessment_template.pdf
```

---

## Dependencies

### Required npm packages:

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.22.3",
    "react-helmet-async": "^2.0.4",
    "lucide-react": "^0.344.0",
    "jspdf": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@types/jspdf": "^1.3.3",
    "typescript": "^5.5.3",
    "tailwindcss": "^3.4.1"
  }
}
```

### Installation Command:
```bash
npm install react react-dom react-router-dom react-helmet-async lucide-react jspdf
npm install -D @types/react @types/react-dom @types/jspdf typescript tailwindcss
```

---

## Step-by-Step Implementation

### Step 1: Set Up Base Structure

1. **Create the main Tools page** (`src/pages/Tools.tsx`):
   - Set up basic component structure
   - Add tab state management
   - Create hero section

2. **Create tools directory** (`src/pages/tools/`):
   - Create individual tool component files
   - Set up basic component structure for each

3. **Set up public folder** (`public/rental_documents/`):
   - Add all PDF/DOCX files
   - Ensure proper file naming (spaces are OK, but be consistent)

### Step 2: Implement Main Tools Page

**File**: `src/pages/Tools.tsx`

Key features to implement:
- Tab state with `useState`
- URL hash detection with `useEffect` and `useLocation`
- Hero section with background image
- Tab navigation buttons
- Conditional rendering based on active tab
- Tools grid with cards
- SEO component integration
- Structured data (JSON-LD)

### Step 3: Implement Individual Tools

Each tool follows a similar pattern:

1. **Import dependencies**:
   - React hooks (`useState`)
   - React Router (`Link`, `useNavigate` if needed)
   - Icons from `lucide-react`
   - SEO component
   - Any tool-specific libraries (e.g., `jsPDF`)

2. **State management**:
   - Define state variables for user inputs/results
   - Create handler functions

3. **UI structure**:
   - Back navigation link
   - Main content area
   - Interactive elements
   - Results/feedback section
   - SEO component

4. **SEO implementation**:
   - Add SEO component with appropriate meta tags
   - Include structured data if applicable

### Step 4: Implement Rental Documents Component

**File**: `src/pages/tools/RentalDocuments.tsx`

Key features:
- Document array with metadata
- Structured data generation (HowTo, ItemList)
- Grid layout for document cards
- Download links with proper attributes
- SEO-optimized content

### Step 5: Set Up Routing

**File**: `src/App.tsx`

Add routes:
```tsx
<Route path="/tools" element={<Tools />} />
<Route path="/tools/readiness-checker" element={<ReadinessChecker />} />
<Route path="/tools/document-tracker" element={<DocumentTracker />} />
<Route path="/tools/viewing-tracker" element={<ViewingTracker />} />
<Route path="/tools/process-simulator" element={<ProcessSimulator />} />
<Route path="/tools/timeline-generator" element={<TimelineGenerator />} />
<Route path="/tools/know-your-rights" element={<KnowYourRights />} />
```

### Step 6: Implement SEO Component

**File**: `src/components/SEO.tsx`

This is a shared component that handles:
- Meta tags (title, description, keywords)
- Open Graph tags
- Twitter Card tags
- Canonical URLs
- Structured data (JSON-LD)
- Article-specific meta tags

---

## Component Breakdown

### 1. Tools.tsx (Main Page)

**Purpose**: Main landing page with tab navigation

**Key Features**:
- Tab switching between "Interactive Tools" and "Rental Documents"
- URL hash support (`#documents` opens documents tab)
- Hero section with background image
- Tools grid displaying all available tools
- SEO content section

**State**:
```typescript
const [activeTab, setActiveTab] = useState<'tools' | 'documents'>('tools');
```

**Tools Array Structure**:
```typescript
{
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  link: string;
  color: string; // Tailwind classes
}
```

### 2. ReadinessChecker.tsx

**Purpose**: Assess rental application readiness

**Features**:
- Multiple choice questions (Yes/No)
- Readiness calculation based on answers
- PDF checklist generation
- Progress tracking

**State**:
```typescript
const [answers, setAnswers] = useState<Record<string, boolean | null>>({});
const [readinessState, setReadinessState] = useState<string | null>(null);
```

**Dependencies**: `jspdf` for PDF generation

### 3. DocumentTracker.tsx

**Purpose**: Track which rental documents user has

**Features**:
- Categorized checklist (Identity, Income, Rental History, Guarantor)
- Progress percentage calculation
- Visual progress bar
- Checkbox interactions

**State**:
```typescript
const [checked, setChecked] = useState<Record<string, boolean>>({});
```

### 4. ViewingTracker.tsx

**Purpose**: Track property viewings and agent communications

**Features**:
- Add/view/edit property viewings
- Store viewing details (date, agent, notes)
- Local storage persistence (optional)
- List view of all viewings

**State**:
```typescript
const [viewings, setViewings] = useState<Viewing[]>([]);
```

### 5. ProcessSimulator.tsx

**Purpose**: Walkthrough of rental application process

**Features**:
- Step-by-step process explanation
- Interactive timeline
- Visual process flow
- Information cards for each step

### 6. TimelineGenerator.tsx

**Purpose**: Estimate rental application timeline

**Features**:
- User input form (situation, documents, etc.)
- Timeline calculation algorithm
- Visual timeline display
- Estimated dates

**State**:
```typescript
const [inputs, setInputs] = useState<TimelineInputs>({});
const [timeline, setTimeline] = useState<TimelineResult | null>(null);
```

### 7. KnowYourRights.tsx

**Purpose**: Interactive guide to UK tenant rights

**Features**:
- Expandable sections
- Checklist functionality
- Progress tracking
- FAQ section
- Based on official DLUHC guide

**State**:
```typescript
const [checked, setChecked] = useState<Record<string, boolean>>({});
const [expandedSection, setExpandedSection] = useState<string | null>(null);
```

**Structured Data**:
- FAQPage schema
- HowTo schema
- WebApplication schema

### 8. RentalDocuments.tsx

**Purpose**: Download section for official rental documents

**Features**:
- Document cards with metadata
- Download links
- File type indicators
- Category tags
- Structured data (HowTo, ItemList)

**Document Structure**:
```typescript
{
  id: string;
  title: string;
  description: string;
  file: string; // Path to file in public folder
  icon: LucideIcon;
  category: string;
  color: string; // Tailwind classes
}
```

---

## Data Structures

### Tool Configuration
```typescript
interface Tool {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  link: string;
  color: string;
}
```

### Document Configuration
```typescript
interface Document {
  id: string;
  title: string;
  description: string;
  file: string;
  icon: LucideIcon;
  category: string;
  color: string;
}
```

### SEO Props
```typescript
interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article';
  keywords?: string[];
  relatedTerms?: string[];
  category?: string;
}
```

---

## Routing Setup

### App.tsx Configuration

```tsx
import { Routes, Route } from 'react-router-dom';
import Tools from './pages/Tools';
import ReadinessChecker from './pages/tools/ReadinessChecker';
// ... other imports

function App() {
  return (
    <Routes>
      <Route path="/tools" element={<Tools />} />
      <Route path="/tools/readiness-checker" element={<ReadinessChecker />} />
      <Route path="/tools/document-tracker" element={<DocumentTracker />} />
      <Route path="/tools/viewing-tracker" element={<ViewingTracker />} />
      <Route path="/tools/process-simulator" element={<ProcessSimulator />} />
      <Route path="/tools/timeline-generator" element={<TimelineGenerator />} />
      <Route path="/tools/know-your-rights" element={<KnowYourRights />} />
    </Routes>
  );
}
```

### Navigation Links

Use React Router's `Link` component:
```tsx
import { Link } from 'react-router-dom';

<Link to="/tools/readiness-checker">Use Tool</Link>
```

### Hash Navigation

For tab switching with URL hash:
```tsx
// Set tab based on hash
useEffect(() => {
  const hash = location.hash.slice(1);
  if (hash === 'documents') {
    setActiveTab('documents');
  }
}, [location]);

// Update URL when tab changes
onClick={() => {
  setActiveTab('documents');
  window.history.replaceState(null, '', '/tools#documents');
}}
```

---

## Styling Approach

### Tailwind CSS Classes

The section uses Tailwind CSS for styling. Key patterns:

**Responsive Design**:
- `sm:`, `md:`, `lg:` breakpoints
- Mobile-first approach

**Color Scheme**:
- Primary: Indigo (`indigo-600`, `indigo-700`)
- Background: White/Gray (`gray-50`, `gray-100`, `gray-900`)
- Accent colors per tool (blue, green, purple, orange, teal, red)

**Layout**:
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Flexbox: `flex items-center justify-between`
- Spacing: `p-8`, `mb-8`, `gap-8`

**Components**:
- Cards: `rounded-xl shadow-lg border border-gray-100`
- Buttons: `px-6 py-3 rounded-lg bg-indigo-600 text-white`
- Icons: `h-6 w-6` or `h-5 w-5`

### Custom Styles

If using custom fonts (like Archivo):
```css
/* In your CSS file or Tailwind config */
.font-archivo {
  font-family: 'Archivo', sans-serif;
}
```

---

## SEO Implementation

### SEO Component Usage

Each page/tool uses the SEO component:

```tsx
<SEO
  title="Page Title | Site Name"
  description="Meta description (150-160 characters)"
  canonical="/tools/readiness-checker"
  keywords={['keyword1', 'keyword2']}
  relatedTerms={['related term1', 'related term2']}
  category="Rental Tools"
/>
```

### Structured Data (JSON-LD)

**Tools Page**:
- WebApplication schema
- ItemList schema

**Know Your Rights**:
- FAQPage schema
- HowTo schema
- WebApplication schema

**Rental Documents**:
- HowTo schema
- ItemList schema
- DigitalDocument schema

**Example**:
```tsx
<Helmet>
  <script type="application/ld+json">
    {JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Tool Name',
      // ... more properties
    })}
  </script>
</Helmet>
```

### Meta Tags

The SEO component automatically generates:
- Title tag
- Meta description
- Keywords
- Open Graph tags
- Twitter Card tags
- Canonical URL
- Article tags (if applicable)

---

## Features & Functionality

### Tab Navigation

**Implementation**:
1. State management for active tab
2. URL hash detection on mount
3. URL update on tab change
4. Conditional rendering

**Code Pattern**:
```tsx
const [activeTab, setActiveTab] = useState<'tools' | 'documents'>('tools');

useEffect(() => {
  const hash = location.hash.slice(1);
  if (hash === 'documents') setActiveTab('documents');
}, [location]);

{activeTab === 'tools' && <ToolsGrid />}
{activeTab === 'documents' && <RentalDocuments />}
```

### PDF Generation

**Used in**: ReadinessChecker

**Implementation**:
```tsx
import { jsPDF } from 'jspdf';

const downloadChecklist = () => {
  const doc = new jsPDF();
  // Add content
  doc.text('Title', x, y);
  // Save
  doc.save('filename.pdf');
};
```

### Local Storage (Optional)

For tools that need persistence (e.g., ViewingTracker):

```tsx
// Save
localStorage.setItem('viewings', JSON.stringify(viewings));

// Load
const saved = localStorage.getItem('viewings');
if (saved) {
  setViewings(JSON.parse(saved));
}
```

### Progress Tracking

**Used in**: DocumentTracker, KnowYourRights

**Calculation**:
```tsx
const totalItems = items.length;
const checkedCount = Object.values(checked).filter(Boolean).length;
const percentage = (checkedCount / totalItems) * 100;
```

### Expandable Sections

**Used in**: KnowYourRights

**Implementation**:
```tsx
const [expandedSection, setExpandedSection] = useState<string | null>(null);

const toggleSection = (id: string) => {
  setExpandedSection(expandedSection === id ? null : id);
};

{expandedSection === section.id && <SectionContent />}
```

---

## Testing & Deployment

### Development

1. **Start dev server**:
   ```bash
   npm run dev
   ```

2. **Test each tool**:
   - Navigate to `/tools`
   - Test tab switching
   - Test each individual tool
   - Verify downloads work
   - Check responsive design

3. **Test routing**:
   - Direct navigation to tool URLs
   - Hash navigation (`/tools#documents`)
   - Back button functionality

### Build

```bash
npm run build
```

### Deployment Checklist

- [ ] All routes are accessible
- [ ] PDF files are in `public/rental_documents/`
- [ ] All images referenced exist
- [ ] SEO meta tags are correct
- [ ] Structured data validates (use Google's Rich Results Test)
- [ ] Mobile responsive design works
- [ ] All links work correctly
- [ ] PDF generation works
- [ ] No console errors

### SEO Validation

1. **Google Rich Results Test**: https://search.google.com/test/rich-results
2. **Schema Markup Validator**: https://validator.schema.org/
3. **Meta Tags Checker**: Various online tools

---

## Customization Guide

### Adding a New Tool

1. **Create component file**: `src/pages/tools/NewTool.tsx`
2. **Add to tools array** in `Tools.tsx`:
   ```tsx
   {
     id: 'new-tool',
     title: 'New Tool Name',
     icon: SomeIcon,
     description: 'Tool description',
     link: '/tools/new-tool',
     color: 'bg-purple-50 text-purple-600'
   }
   ```
3. **Add route** in `App.tsx`:
   ```tsx
   <Route path="/tools/new-tool" element={<NewTool />} />
   ```
4. **Import component** in `App.tsx`

### Adding a New Document

1. **Add file** to `public/rental_documents/`
2. **Add to documents array** in `RentalDocuments.tsx`:
   ```tsx
   {
     id: 'new-document',
     title: 'Document Title',
     description: 'Document description',
     file: '/rental_documents/filename.pdf',
     icon: FileText,
     category: 'Category Name',
     color: 'bg-blue-50 text-blue-600'
   }
   ```

### Changing Colors

Update the `color` property in tool/document arrays:
- Available Tailwind color classes: `bg-{color}-50 text-{color}-600`
- Common colors: blue, green, purple, orange, indigo, teal, red

### Modifying SEO

Update SEO props in each component:
- Title: Keep under 60 characters
- Description: Keep under 160 characters
- Keywords: Add relevant search terms
- Related terms: Add semantic variations

---

## Common Patterns & Code Snippets

### Back Navigation Link
```tsx
<Link 
  to="/tools" 
  className="inline-flex items-center text-indigo-600 hover:text-indigo-700 mb-8"
>
  <ArrowLeft className="h-5 w-5 mr-2" />
  Back to Tools
</Link>
```

### Card Component
```tsx
<div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow p-8">
  <h3 className="text-xl font-bold text-gray-900 mb-3">Title</h3>
  <p className="text-gray-600 mb-6">Description</p>
</div>
```

### Button Component
```tsx
<button
  onClick={handleClick}
  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
>
  Button Text
</button>
```

### Progress Bar
```tsx
<div className="w-full bg-gray-200 rounded-full h-3">
  <div 
    className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
    style={{ width: `${percentage}%` }}
  />
</div>
```

---

## Troubleshooting

### Common Issues

1. **Routes not working**:
   - Check route definitions in `App.tsx`
   - Verify component imports
   - Check for typos in paths

2. **PDF files not downloading**:
   - Verify files exist in `public/rental_documents/`
   - Check file paths (case-sensitive)
   - Ensure proper file permissions

3. **Tab not switching**:
   - Check state management
   - Verify URL hash handling
   - Check button onClick handlers

4. **SEO not working**:
   - Verify SEO component is imported
   - Check meta tag props
   - Validate structured data JSON

5. **Styling issues**:
   - Verify Tailwind is configured
   - Check class names for typos
   - Ensure responsive breakpoints are correct

---

## Additional Resources

### Documentation Links
- [React Router v6](https://reactrouter.com/)
- [React Helmet Async](https://github.com/staylor/react-helmet-async)
- [Lucide Icons](https://lucide.dev/)
- [jsPDF](https://github.com/parallax/jsPDF)
- [Tailwind CSS](https://tailwindcss.com/)
- [Schema.org](https://schema.org/)

### Testing Tools
- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema Validator](https://validator.schema.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

---

## Summary

This Tools Section is a complete, self-contained feature that:
- Requires no backend
- Works entirely client-side
- Is fully SEO optimized
- Provides interactive tools for users
- Offers downloadable official documents
- Is responsive and accessible

Follow this guide step-by-step to rebuild the section in a new project. Each component is modular and can be customized to fit your specific needs.

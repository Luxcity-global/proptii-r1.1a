# Marketing Hub Components

This directory contains all the reusable components for the Marketing Hub application.

## Component Categories

### UI Components (`/ui/`)

Base shadcn/ui components with Lux brand styling:

- `button.tsx` - Button component with variants
- `card.tsx` - Card components (Card, CardHeader, CardContent, etc.)
- `input.tsx` - Input field component
- `badge.tsx` - Badge component for status indicators
- `avatar.tsx` - Avatar component for user profiles
- `table.tsx` - Table components for data display
- `tabs.tsx` - Tab navigation components
- `select.tsx` - Select dropdown component
- `textarea.tsx` - Textarea component
- `label.tsx` - Label component for form fields
- `progress.tsx` - Progress bar component
- `separator.tsx` - Visual separator component
- `dropdown-menu.tsx` - Dropdown menu component
- `sonner.tsx` - Toast notification component

### Specialized Components

- `kpi-card.tsx` - KPI display card with trend indicators
- `status-badge.tsx` - Status badge with icons and colors
- `action-button.tsx` - Action buttons with predefined styles
- `skeleton-loader.tsx` - Loading skeleton components
- `skip-link.tsx` - Accessibility skip links

### Animated Components

- `animated-card.tsx` - Cards with Framer Motion animations
- `animated-button.tsx` - Buttons with hover and press animations

### Layout Components

- `container.tsx` - Responsive container and grid components
- `header.tsx` - Main application header
- `welcome-page.tsx` - Welcome/landing page
- `dashboard.tsx` - Dashboard page
- `property-marketing.tsx` - Property marketing page
- `write-content.tsx` - Content writing page
- `social-media-assets.tsx` - Social media assets page
- `copilot.tsx` - AI assistant drawer

## Usage Examples

### Basic Button

```tsx
import { Button } from "./ui/button";

<Button variant="default" size="lg">
  Click me
</Button>;
```

### KPI Card

```tsx
import { KPICard } from "./kpi-card";

<KPICard
  title="Total Leads"
  value="1,234"
  trend="up"
  trendValue="+12%"
  status="good"
/>;
```

### Animated Card

```tsx
import { AnimatedCard } from "./animated-card";

<AnimatedCard animation="slide" delay={0.2}>
  <CardContent>
    <h3>Animated Content</h3>
  </CardContent>
</AnimatedCard>;
```

### Responsive Grid

```tsx
import { ResponsiveGrid } from "./container";

<ResponsiveGrid cols={{ default: 1, sm: 2, md: 3, lg: 4 }} gap="md">
  {items.map((item) => (
    <Card key={item.id}>{item.content}</Card>
  ))}
</ResponsiveGrid>;
```

## Design System

All components follow the Lux brand design system:

- **Colors**: Lux Blue (#136C9E), Lux Orange (#DC5F12), Lux Green, Lux Cream
- **Typography**: Inter font family
- **Spacing**: 4px base unit with consistent scale
- **Border Radius**: 0.5rem default
- **Shadows**: Subtle shadows for depth

## Accessibility

All components include:

- ARIA labels and attributes
- Keyboard navigation support
- Screen reader compatibility
- Focus management
- High contrast mode support
- Reduced motion support

## Responsive Design

Components are built mobile-first with responsive breakpoints:

- `xs`: 475px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px
- `3xl`: 1920px

## Animation

Components use Framer Motion for smooth animations:

- Hover effects
- Page transitions
- Loading states
- Stagger animations
- Reduced motion support


# Dashboard Layout Specification

## Overview
This document provides the exact specifications for creating a visually consistent dashboard layout that matches the existing Proptii dashboard design. Focus is on structural elements, spacing, and dimensions rather than specific card content.

## Page Structure

### Main Container
```css
Container: Grid container
Background Color: #EDF3FA
Padding: 24px (3 * 8px MUI spacing unit)
Height: 100%
Spacing between grid items: 24px (spacing={3})
```

### Grid Layout System
```css
Grid Container Properties:
- spacing={3} (24px gaps)
- bgcolor={'#EDF3FA'}
- padding={3} (24px)
- height={'100%'}

Grid Item Sizing:
- Cards: xs={12} md={6} (2 cards per row on desktop, stacked on mobile)
- Full-width sections: xs={12} md={12}
```

## Card Specifications

### Standard Card Container (DashboardCard)
```css
Component: Paper (styled)
Border Radius: 12px
Height: 400px
Display: flex
Flex Direction: row
Box Shadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
Overflow: hidden
```

### Card Sidebar (Left Section)
```css
Background Color: #4E97CC
Color: white
Padding: 24px (theme.spacing(3))
Width: 33.33%
Display: flex
Flex Direction: column
```

### Card Content (Right Section)
```css
Padding: 24px (theme.spacing(3))
Flex Grow: 1
Background Color: #FFFFFF
Width: 100%
Position: relative
```

### Icon Wrapper (in Sidebar)
```css
Background Color: white
Border Radius: 50%
Width: 34px
Height: 34px
Display: flex
Align Items: center
Justify Content: center
Margin Right: 12px (theme.spacing(1.5))

Icon Properties:
- Color: #2f7db0
- Font Size: 1.2rem
```

### Stats Number Typography
```css
Font Size: 2.1rem
Font Weight: 700
Color: white
Margin Bottom: 8px (theme.spacing(1))
```

## Navigation Header (if applicable)
*Note: Adjust based on your specific header implementation*

```css
Suggested Header Height: 64px
Background: white or primary theme color
Box Shadow: minimal elevation
Z-index: should be higher than content
```

## Sidebar (if applicable)
*Note: Adjust based on your specific sidebar implementation*

### Expanded Sidebar
```css
Width: 240px
Background: typically white or theme primary
Transition: width 0.3s ease
```

### Collapsed Sidebar
```css
Width: 64px
Icons only, no text
Maintain same background and styling
Transition: width 0.3s ease
```

## Responsive Breakpoints

### Desktop (md and up)
```css
Grid Items: md={6} (2 cards per row)
Full Width Items: md={12}
Container Padding: 24px
```

### Tablet (sm)
```css
Grid Items: xs={12} (stacked)
Container Padding: 16px
```

### Mobile (xs)
```css
Grid Items: xs={12} (stacked)
Container Padding: 12px
Card Height: auto (remove fixed 400px)
```

## Color Palette

### Background Colors
```css
Main Background: #EDF3FA
Card Background: #FFFFFF
Sidebar Background: #4E97CC
Section Headers: #F5F5F5
```

### Text Colors
```css
Primary Text: #374957
Secondary Text: rgba(0, 0, 0, 0.6)
White Text: #FFFFFF
```

## Spacing Standards

### Padding Values
```css
Large Padding: 24px (theme.spacing(3))
Medium Padding: 16px (theme.spacing(2))
Small Padding: 12px (theme.spacing(1.5))
Extra Small: 8px (theme.spacing(1))
```

### Margin Values
```css
Section Margins: 24px bottom
Element Margins: 8px, 16px, 24px as needed
```

### Border Radius
```css
Cards: 12px
Small Elements: 4px
Buttons: 8px
Icons: 50% (circular)
```

## Typography Scale

### Headers
```css
Main Title: variant="h5" (2rem)
Card Title: variant="subtitle1", fontWeight={600}, fontSize="1.2rem"
Section Headers: variant="h6", fontWeight="bold"
```

### Body Text
```css
Primary: variant="body1"
Secondary: variant="body2"
Captions: variant="caption"
```

## Implementation Notes

### Material-UI Components Used
- Grid (container and items)
- Paper (for cards)
- Box (for layout containers)
- Typography (for all text)
- styled() (for custom components)

### Key Styled Components to Create
1. **DashboardCard**: Main card container
2. **CardSidebar**: Left sidebar section of cards
3. **CardContent**: Right content section of cards
4. **IconWrapper**: Circular icon containers
5. **StatsNumber**: Large number displays

### CSS-in-JS Styling Pattern
```javascript
const DashboardCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  overflow: 'hidden',
  height: '400px',
  display: 'flex',
  flexDirection: 'row',
  boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)'
}));
```

## Layout Structure Template
```jsx
<Grid container spacing={3} bgcolor={'#EDF3FA'} padding={3} height={'100%'}>
  {/* Card 1 */}
  <Grid item xs={12} md={6}>
    <DashboardCard>
      <CardSidebar>
        {/* Sidebar content */}
      </CardSidebar>
      <CardContent>
        {/* Main content */}
      </CardContent>
    </DashboardCard>
  </Grid>
  
  {/* Card 2 */}
  <Grid item xs={12} md={6}>
    {/* Similar structure */}
  </Grid>
  
  {/* Full width section */}
  <Grid item xs={12} md={12}>
    <Paper sx={{ bgcolor: '#FFFFFF', borderRadius: 4, p: 3 }}>
      {/* Full width content */}
    </Paper>
  </Grid>
</Grid>
```

## Visual Consistency Checklist
- [ ] Main background color matches (#EDF3FA)
- [ ] Card dimensions and spacing are identical
- [ ] Sidebar width ratio is 33.33%
- [ ] Icon wrapper dimensions are 34x34px
- [ ] Border radius values are consistent
- [ ] Typography scales match
- [ ] Color palette is applied correctly
- [ ] Grid spacing is set to 3 (24px)
- [ ] Box shadows match the specified values

This specification should allow you to recreate the exact visual structure and feel of the current dashboard in your new repository.

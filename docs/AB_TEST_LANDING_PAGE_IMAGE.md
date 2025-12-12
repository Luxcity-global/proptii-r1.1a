# A/B Test: Landing Page Hero Image

## Overview
This document describes the A/B test implementation for the landing page hero image on the Home page (`/`).

## Test Details

**Test Name:** `landing-page-hero-image`

**Variants:**
- **Variant A (Control):** Family on couch image (`01_Lady_Child_Family_BG.jpg`)
- **Variant B (Test):** Woman signing document image (`young-caucasian-woman-smiling-while-signing-document-handed-by-middle-aged-man 1.png`)

## Implementation

### Files Modified
1. **`src/hooks/useABTest.ts`** - Custom hook for A/B testing
2. **`src/pages/Home.tsx`** - Updated to use A/B test hook for hero image selection

### How It Works

1. **Variant Assignment:**
   - On first visit, users are randomly assigned to Variant A or B (50/50 split)
   - The assigned variant is stored in `localStorage` with key `ab-test-landing-page-hero-image`
   - Users will see the same variant on subsequent visits for consistency

2. **Analytics Tracking:**
   - `ABTest_Assignment` event is tracked when a new variant is assigned
   - `ABTest_View` event is tracked when a stored variant is loaded
   - Both events include:
     - `testName`: "landing-page-hero-image"
     - `variant`: "A" or "B"
     - `source`: "random" or "localStorage"

## Analyzing Results

### In Application Insights

1. **View Assignment Events:**
   ```
   Event: ABTest_Assignment
   Filter by: testName = "landing-page-hero-image"
   ```

2. **View Distribution:**
   - Check the count of Variant A vs Variant B assignments
   - Should be approximately 50/50 if test is running correctly

3. **Track Conversions:**
   - Monitor user actions after viewing each variant:
     - Clicks on "Get Started" button
     - Search queries submitted
     - User type selections (Tenant/Agent/Homeowner)
     - Navigation to other pages

4. **Key Metrics to Compare:**
   - **Engagement Rate:** % of users who interact with the page
   - **Conversion Rate:** % of users who click "Get Started" or perform key actions
   - **Bounce Rate:** % of users who leave without interaction
   - **Time on Page:** Average time spent on landing page

### Recommended Analysis

1. **Statistical Significance:**
   - Collect data for at least 1,000 visitors per variant
   - Use statistical tests (chi-square, t-test) to determine if differences are significant
   - Aim for 95% confidence level

2. **Segmentation:**
   - Analyze results by:
     - User type (new vs returning)
     - Device type (mobile vs desktop)
     - Traffic source
     - Geographic location

## Managing the Test

### To Reset the Test
Clear the localStorage key for all users (or specific users):
```javascript
localStorage.removeItem('ab-test-landing-page-hero-image');
```

### To Force a Specific Variant (for testing)
In browser console:
```javascript
localStorage.setItem('ab-test-landing-page-hero-image', 'A'); // or 'B'
```

### To Disable the Test
In `src/pages/Home.tsx`, replace:
```typescript
const imageVariant = useABTest({
  testName: 'landing-page-hero-image',
  trackAssignment: true,
});
```

With:
```typescript
const imageVariant: ABTestVariant = 'A'; // or 'B' to use the new image permanently
```

## Next Steps

1. **Monitor the test** for at least 2-4 weeks
2. **Collect sufficient data** (minimum 1,000 visitors per variant)
3. **Analyze results** in Application Insights
4. **Make decision** based on conversion metrics
5. **Implement winning variant** permanently or run additional tests

## Extending the Test

To add more variants or test other elements:
1. Update the `useABTest` hook if needed
2. Add new test names for different elements
3. Track additional events for user interactions
4. Consider testing:
   - Headline text
   - CTA button text/color
   - Subheading copy
   - Overall layout





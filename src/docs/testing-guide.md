# Form Testing Guide

## Overview

This guide will help you test the form implementation we've created. The form includes validation, draft management, and a multi-step workflow.

## How to Access the Test Form

1. Open your browser and navigate to: http://localhost:5176/referencing-test
2. You should see a form with a stepper showing the different sections

## What to Test

### 1. Form Validation

- **Identity Form**:
  - Try submitting the form without filling in required fields
  - Check that validation errors appear for each required field
  - Test the date of birth validation (must be at least 18 years old)
  - Test the conditional validation for nationality and identity proof (only required for non-British citizens)

- **Employment Form**:
  - Test the conditional fields that appear based on employment status
  - Verify that validation works for required fields

- **Residential Form**:
  - Test the conditional fields that appear when duration at current address is less than 3 years
  - Verify that validation works for required fields

### 2. Draft Management

- **Saving Drafts**:
  - Fill out some fields and click the save icon
  - Enter a name for your draft and save it
  - Verify that the "Last saved" timestamp appears

- **Loading Drafts**:
  - Click the folder icon to view saved drafts
  - Select a draft to load
  - Verify that the form fields are populated with the saved data

- **Deleting Drafts**:
  - Click the delete icon next to a draft
  - Confirm the deletion
  - Verify that the draft is removed from the list

### 3. Navigation

- **Next/Back Buttons**:
  - Fill out the Identity form and click Next
  - Verify that you move to the Employment form
  - Click Back and verify that you return to the Identity form with your data preserved

- **Stepper**:
  - Complete multiple sections and verify that the stepper shows your progress

## Expected Behavior

1. **Validation**:
   - Required fields should show error messages when left empty
   - Fields should validate in real-time as you type
   - Conditional validation should work based on other field values

2. **Draft Management**:
   - Drafts should be saved to localStorage
   - Auto-save should occur every 30 seconds
   - Loading a draft should replace the current form data

3. **Navigation**:
   - Moving between steps should preserve your data
   - The final step should show a "Submit" button instead of "Next"
   - After completing all steps, you should see a completion message

## Known Issues

- The Financial, Guarantor, and Credit Check forms are currently placeholders
- Some Material UI components may have styling issues
- File uploads are not persisted between sessions (they're stored in memory)

## Feedback

As you test the form, please note any issues or suggestions for improvement. This will help us prioritize the next steps in the implementation. 
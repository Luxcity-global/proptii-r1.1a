# MCP Sandbox UI Integration Plan

This document outlines the step-by-step plan for integrating the new MCP Sandbox frontend UI with the backend API and overall MCP build.

---

## 1. Review Backend API Endpoints

- Confirm available endpoints for property search, property details, etc. (e.g., `/api/mcp/search`, `/api/mcp/property/:id`).
- Review expected request/response formats.

## 2. Set Up API Service Layer in Frontend

- Create a `services/api.ts` file in the frontend.
- Implement functions to call the backend search endpoint (e.g., `searchProperties(query)`).
- Add error handling and loading state management.

## 3. Connect Search Bar to Backend

- On search submit, call the backend API instead of filtering mock data.
- Update the UI to show loading state while fetching.
- Display results from the backend in the property grid.

## 4. Handle API Response & Data Mapping

- Map backend property data to the frontend property card format.
- Handle cases where fields may be missing or differently named.

## 5. Implement Property Details Fetch

- When a property card is clicked, fetch full property details from the backend (`/api/mcp/property/:id`).
- Prepare for modal or details page integration.

## 6. Add Error & Loading States

- Show a loading spinner while fetching data.
- Display user-friendly error messages if the API call fails.

## 7. Environment Configuration

- Ensure the frontend uses the correct API base URL for local/dev/prod environments.
- Use environment variables (e.g., `.env`) for API URLs.

## 8. Test End-to-End

- Test the full search flow: user enters a query, results are fetched from the backend, cards are displayed, and details can be viewed.
- Test error and edge cases (no results, API down, etc.).

## 9. Clean Up & Refactor

- Remove or comment out mock data.
- Refactor code for maintainability (e.g., move API logic to hooks/services).

## 10. Document Integration

- Update documentation to reflect the new integration.
- Note any API contract assumptions or required backend changes.

---

# Landlord & Agent Viewings Page

This doc explains what was delivered for the landlord/agent portal and what you (or downstream client teams) need to know when integrating or extending the feature.

## What was built
- **New Viewings dashboard** (`src/landlord_agent/src/components/ViewingsPage.tsx`)
  - Summary cards: pending requests, scheduled, completed, cancelled.
  - Tabbed lists: *Requests*, *Scheduled*, *Past* with search-ready layout and status chips.
  - Action modals:
    - Schedule incoming requests (collect date/time + tenant contact, creates viewing booking + sends email).
    - Reschedule existing bookings (records note, updates Firestore, emails tenant).
    - Cancel viewings (captures optional message, updates Firestore, emails tenant).
  - Toast-style feedback for every action.
- **Navigation integration**
  - `MainLayout` sidebar now exposes a "Viewings" item between Documents and Contracts.
  - `App.tsx` routes the navigation screen to the new component and resolves the current manager id (landlord/agent) so the page scopes Firestore queries correctly.
- **Data enhancements**
  - Firestore `viewingBookings` now stores `landlordId` & `agentId` on create.
  - `bookViewingRequests` captures the same identifiers and exposes manager-scoped fetch/subscribe helpers.
  - Manager-focused getter/subscription utilities + stats calculators were added to `viewingService` and `bookViewingRequestService` so the portal can remain reactive.
  - Tenant booking flows (modal + `BookViewing` page) now forward the agent id when a viewing request or booking is created.

## Client-side changes already shipped
- **Landlord web app** now includes the full Viewings experience described above.
- **Shared services** (Firestore + email) were updated to support manager scoping and the new workflows—no additional client wiring is required to consume them.
- **New build artefacts**: ensure you deploy the latest landlord bundle (`index-5hUP8PDs.js`, `index-BU7YyVsh.css`) or rebuild if you continue iterating.

## Additional work the client may need
- **Firestore indexes**: create composite indexes for `viewingBookings` and `bookViewingRequests` on `(landlordId, createdAt)` and `(agentId, createdAt)` to avoid query failures once the data set grows.
- **Email templates**: confirm the backend mailer has templates for `viewing-user`, `viewing-reschedule`, and `viewing-cancel`, or adjust `emailService` to point at updated designs.
- **Authentication bridge**: the manager id is resolved from the authenticated user; if the hosting environment uses a different identity payload, update `resolveManagerId()` in `App.tsx` accordingly.
- **Styling tokens**: the page inherits the landlord palette; if the design system changes, adjust shared CSS variables (input focus, summary cards, etc.) before release.
- **Analytics/Logging**: no telemetry was added. Hook into your analytics platform if you need usage insight for scheduling actions.

## Deployment checklist
- [ ] Run `cd src/landlord_agent ; npm run build` to produce the latest bundle.
- [ ] Copy `build/assets/index-*.js` and `index-*.css` into `public/assets/` (or your hosting target).
- [ ] Ensure `public/landlord/index.html` references the new filenames.
- [ ] Hard-refresh the landlord portal and verify the Viewings tab appears and actions sync in Firestore.



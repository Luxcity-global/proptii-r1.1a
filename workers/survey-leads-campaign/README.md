# Survey leads campaign (Cloudflare Worker + D1)

Standalone questionnaire, lead API, and admin view. This does **not** write to Firestore `campaign_leads` or use the Nest `/api/leads` service.

## URLs

- `/` and `/campaign` — questionnaire
- `/welcome` — reward / trial unboxing
- `/admin/leads` — lead table + CSV (authentication is a follow-up task; this route is currently open)
- `POST /api/leads` — save a submission
- `GET /api/leads` — list leads
- `GET /api/leads/export` — CSV
- `GET /api/leads/session?token=` — welcome-page session
- `POST /api/leads/:id/activate` — attach/confirm email

## Local

```bash
cd workers/survey-leads-campaign
npm install
cp .dev.vars.example .dev.vars
npx wrangler d1 migrations apply survey-leads-campaign --local
npx wrangler dev --port 8787
```

Then open [http://localhost:8787/campaign](http://localhost:8787/campaign) and [http://localhost:8787/admin/leads](http://localhost:8787/admin/leads).

## Deploy

```bash
npx wrangler login
npx wrangler d1 create survey-leads-campaign
# paste the returned database_id into wrangler.jsonc
npx wrangler d1 migrations apply survey-leads-campaign --remote
npx wrangler secret put LEAD_HMAC_SECRET
npx wrangler deploy
```

Free-plan D1 and Workers are enough for this survey.

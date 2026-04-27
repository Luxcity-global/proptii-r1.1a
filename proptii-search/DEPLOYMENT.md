# 🚀 Deploying Proptii Search to Railway

This guide provides step-by-step instructions for deploying the `proptii-search` backend to Railway and connecting it to your frontend application.

## 1. Prerequisites
- A [Railway.app](https://railway.app/) account.
- Your project pushed to a GitHub repository.
- `proptii-search` backend and the frontend application (either in the same repo or separate ones).

---

## 2. Deploy the Backend (`proptii-search`)

### A. Create the Project
1. Go to [Railway.app](https://railway.app/) and click **New Project**.
2. Select **Deploy from GitHub repo**.
3. Choose your repository. If the backend is in a subfolder, you can specify the **Root Directory** as `proptii-search` in the Railway service settings later.

### B. Add MongoDB
1. In your Railway project, click **New** -> **Database** -> **Add MongoDB**.
2. Wait for it to provision.

### C. Add Redis (Required for BullMQ)
1. In your Railway project, click **New** -> **Database** -> **Add Redis**.
2. Wait for it to provision.

### D. Configure Environment Variables
Go to the **Variables** tab of your `proptii-search` service and add the following:

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `PORT` | `3000` | Railway default. Your app now supports this. |
| `MONGODB_URI` | `${{MongoDB.MONGODB_URL}}` | Railway will auto-suggest this reference. |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` | Railway will auto-suggest this reference. |
| `NODE_ENV` | `production` | |
| `BRAVE_API_KEY` | `your_api_key_here` | Your Brave Search API key for web search. |

---

## 3. Connect to the Frontend

### A. Get the Backend URL
1. In the Railway dashboard, select your `proptii-search` service.
2. Go to **Settings** -> **Public Networking**.
3. Click **Generate Domain** (if one hasn't been assigned).
4. Copy the resulting URL (e.g., `https://proptii-search-production.up.railway.app`).

### B. Configure Frontend Environment
In your frontend application (the one using `useSearchBackend.ts`):
1. Create or update your `.env.production` (or equivalent) file.
2. Add the following variable:
   ```env
   VITE_SEARCH_BACKEND_URL=https://proptii-search-production.up.railway.app
   ```
3. If you are deploying the frontend to a platform like Vercel, Netlify, or Railway, add this variable in their respective dashboard.

---

## 4. Verification
1. Once both services are deployed, perform a search in the frontend.
2. Check the Railway **Logs** for the `proptii-search` service to ensure:
   - `✅ MongoDB Connected`
   - `✅ Redis Connected`
   - `🚀 Proptii Search Server running on port 3000`
3. If search results appear in the UI, the connection is successful!

---

## Troubleshooting
- **CORS Issues**: Ensure the backend allows requests from your frontend domain. The current backend uses `cors()` which allows all origins by default.
- **Worker Errors**: If property scraping doesn't seem to work, ensure the Redis service is active, as the background worker depends on it.

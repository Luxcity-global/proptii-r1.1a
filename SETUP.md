# Proptii Setup Guide

This guide will help you set up and run the Proptii property search application locally.

## Project Structure

```
proptii-r1.1a-4/
├── src/                    # Frontend source code (React + TypeScript)
├── search/backend/         # Search backend service (Node.js + Express)
├── api/                    # Azure Functions API
├── proptii-backend/        # NestJS backend service
└── SETUP.md               # This file
```

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning/version control)

## Quick Start

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd proptii-r1.1a-4

# Install frontend dependencies
npm install

# Install search backend dependencies
cd search/backend
npm install
cd ../..
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Copy the template and customize
cp env.local.template .env.local
```

**Minimum required `.env.local` configuration:**

```env
# Search Backend URL (for property search functionality)
VITE_SEARCH_BACKEND_URL=http://localhost:3001

# Main API URL (for other backend services)
VITE_API_URL=http://localhost:7071/api

# DocuSign Configuration (use mock values for local development)
VITE_DOCUSIGN_INTEGRATION_KEY=mock_key
VITE_DOCUSIGN_USER_ID=mock_user
VITE_DOCUSIGN_ACCOUNT_ID=mock_account
VITE_DOCUSIGN_BASE_URL=https://demo.docusign.net
VITE_DOCUSIGN_RSA_PRIVATE_KEY=mock_key
VITE_DOCUSIGN_REDIRECT_URI=http://localhost:5173/docusign/callback
```

### 3. Start the Applications

**Terminal 1 - Start Search Backend:**
```bash
cd search/backend
npm run dev
```
*Should run on http://localhost:3001*

**Terminal 2 - Start Frontend:**
```bash
# From project root
npm run dev
```
*Should run on http://localhost:5173*

### 4. Verify Setup

1. **Frontend**: Open http://localhost:5173 - you should see the Proptii homepage
2. **Search Backend**: Open http://localhost:3001/health - should return `{"status":"ok"}`
3. **Search Functionality**: Try searching for properties on the homepage

## Detailed Setup Instructions

### Frontend (React + Vite)

The frontend is a React application built with TypeScript and Vite.

**Location**: Root directory  
**Start Command**: `npm run dev`  
**Port**: 5173  

**Key Features:**
- Property search interface
- User authentication (Azure AD B2C)
- Property listing display
- Booking and referencing forms

### Search Backend (Node.js + Express)

The search backend handles property scraping from various sources.

**Location**: `search/backend/`  
**Start Command**: `npm run dev`  
**Port**: 3001  

**Available Endpoints:**
- `GET /health` - Health check
- `POST /scrape` - OnTheMarket scraping (uses Puppeteer)
- `POST /scrape-internet-real` - Internet search (uses Brave API)
- `POST /scrape-rightmove` - Rightmove scraping
- `POST /scrape-openrent` - OpenRent scraping

### Additional Backend Services

**Azure Functions API** (`api/` folder):
- Authentication endpoints
- Property management
- User management
- Viewing requests

**NestJS Backend** (`proptii-backend/` folder):
- Alternative backend implementation
- Database integration
- Advanced property search

## Environment Variables Reference

### Required for Basic Functionality

| Variable | Purpose | Default |
|----------|---------|---------|
| `VITE_SEARCH_BACKEND_URL` | Search service URL | `http://localhost:3001` |
| `VITE_API_URL` | Main API URL | `http://localhost:7071/api` |

### Optional for Full Functionality

| Variable | Purpose | Notes |
|----------|---------|--------|
| `VITE_DOCUSIGN_*` | DocuSign integration | Use mock values for local dev |
| `VITE_AZURE_AD_*` | Azure AD authentication | Required for auth features |
| `VITE_APPINSIGHTS_*` | Application monitoring | Optional |

## Search Functionality

### How Property Search Works

1. **User Input**: User enters search query (e.g., "2 bedroom flat in Leeds")
2. **Query Processing**: Frontend parses query and builds search parameters
3. **Backend Search**: Search backend scrapes property websites
4. **Results Display**: Properties with valid contact details are shown

### Search Sources

- **OnTheMarket**: Primary source (requires Puppeteer)
- **Internet Search**: Fallback using Brave API
- **Rightmove**: Alternative source
- **OpenRent**: Alternative source

## Troubleshooting

### Common Issues

**1. Search Returns No Results**
- Check if search backend is running on port 3001
- Verify `.env.local` has correct `VITE_SEARCH_BACKEND_URL`
- Browser automation (Puppeteer) may timeout - this is normal in development

**2. Frontend Won't Start**
- Run `npm install` in root directory
- Check Node.js version (should be v16+)
- Clear cache: `npm run build` then `npm run dev`

**3. Search Backend Timeouts**
- Puppeteer browser automation can be slow/unreliable locally
- This is expected behavior - the app will fall back to mock data
- For production, browser automation works more reliably

**4. Environment Variables Not Loading**
- Restart the Vite dev server after changing `.env.local`
- Ensure no trailing spaces or quotes in environment values
- Variable names must start with `VITE_` for frontend access

### Performance Notes

- **First Search**: May take 30-60 seconds due to browser startup
- **Subsequent Searches**: Should be faster (5-15 seconds)
- **Timeout Behavior**: App automatically falls back to sample data

## Development Workflow

### Making Changes

1. **Frontend Changes**: Edit files in `src/` - hot reload should work
2. **Search Backend Changes**: Edit files in `search/backend/src/` - server restarts automatically
3. **Environment Changes**: Restart both services after changing `.env.local`

### Testing Search

```bash
# Test search backend health
curl http://localhost:3001/health

# Test property search (may timeout - this is normal)
curl -X POST http://localhost:3001/scrape \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.onthemarket.com/to-rent/property/leeds/"}'
```

## Production Deployment

### Environment Setup

1. **Frontend**: Deploy to static hosting (Vercel, Netlify, Azure Static Web Apps)
2. **Search Backend**: Deploy to containerized service (Docker, Azure Container Apps)
3. **Environment Variables**: Set production URLs and API keys

### Required Production Environment Variables

```env
VITE_SEARCH_BACKEND_URL=https://your-search-backend.azurecontainerapps.io
VITE_API_URL=https://your-api.azurewebsites.net/api
# ... plus real DocuSign, Azure AD credentials
```

## Support

### Getting Help

1. **Check Console**: Browser developer tools for frontend errors
2. **Check Logs**: Terminal output for backend errors
3. **Verify Environment**: Ensure all required variables are set
4. **Test Components**: Use health endpoints to verify services

### Known Limitations

- Browser automation requires stable internet connection
- Some property websites may block automated scraping
- Rate limiting may affect search results
- Local development has timeout issues (normal behavior)

---

## Quick Reference

**Start Development:**
```bash
# Terminal 1
cd search/backend && npm run dev

# Terminal 2  
npm run dev
```

**Access Applications:**
- Frontend: http://localhost:5173
- Search Backend: http://localhost:3001
- Health Check: http://localhost:3001/health

**Common Commands:**
```bash
npm install                    # Install frontend deps
cd search/backend && npm install  # Install backend deps
npm run build                  # Build frontend for production
npm run preview               # Preview production build
```

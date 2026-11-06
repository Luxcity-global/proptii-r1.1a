# Landlord Dashboard Development Setup

## Current Architecture

The project has **TWO separate React applications**:

### 1. **Main Tenant App** (Port 5173)
- Location: `src/` (root)
- URL: `http://localhost:5173`
- Purpose: Tenant-facing app (search, referencing, bookings, etc.)

### 2. **Landlord Dashboard App** (Port 3000)
- Location: `src/landlord_agent/`
- URL: `http://localhost:3000`
- Purpose: Landlord/Agent management dashboard
- **This is the NEW app with referencing integration**

## Running Both Apps

You need to run **both dev servers** simultaneously:

### Terminal 1: Main Tenant App
```bash
# From project root
npm run dev

# Runs on http://localhost:5173
```

### Terminal 2: Landlord Dashboard App
```bash
# From project root
cd src/landlord_agent
npm run dev

# Runs on http://localhost:3000
```

## Navigation Flow

1. **User lands on:** `http://localhost:5173` (Tenant app homepage)
2. **Clicks "Agent"** tab
3. **Clicks "Go to Landlord Dashboard"**
4. **Redirected to:** `http://localhost:3000` (Landlord dashboard)

## Referencing Integration

The referencing integration works in **both apps**:

### Tenant App (Port 5173)
- Referencing form submission → Saves to Firestore `referencingForms`
- Location: `src/pages/Referencing.tsx`

### Landlord Dashboard (Port 3000)
- Reads from Firestore `referencingForms`
- Shows status for each tenant
- Location: `src/landlord_agent/src/components/ClientsPage.tsx`

Both apps share the **same Firebase project** and Firestore database.

## Firebase Configuration

Both apps use the same Firebase config:

**Main App:** `src/config/firebaseConfig.ts`  
**Landlord App:** `src/landlord_agent/src/config/firebase.ts`

Both point to project: `proptii-16946`

## Starting Fresh

```bash
# Install dependencies for both apps
npm install

cd src/landlord_agent
npm install
cd ../..

# Start both servers
npm run dev & cd src/landlord_agent && npm run dev
```

## Testing the Integration

1. **Start both apps**
```bash
# Terminal 1
npm run dev

# Terminal 2  
cd src/landlord_agent && npm run dev
```

2. **Add a tenant** at `http://localhost:3000`
   - Clients page → Add Tenant
   - Email: `test@example.com`

3. **Submit referencing form** at `http://localhost:5173/referencing`
   - Use same email: `test@example.com`
   - Complete the form

4. **View status** at `http://localhost:3000`
   - Clients page
   - Should show "Referencing: Complete" ✅

## Common Issues

### ❌ "Cannot connect to localhost:3000"
**Solution:** Make sure landlord app is running:
```bash
cd src/landlord_agent
npm run dev
```

### ❌ "Page not found" at /landlord/index.html
**Issue:** Trying to access old static build  
**Solution:** Use `http://localhost:3000` instead

### ❌ "Referencing: Complete" for all tenants
**Issue:** Tenant emails don't match referencing form emails  
**Solution:** Ensure exact email match (case-sensitive!)

## Build for Production

### Build Landlord Dashboard
```bash
cd src/landlord_agent
npm run build

# Output: src/landlord_agent/build/
```

### Deploy Both Apps
- Main tenant app: Deploy from root `/`
- Landlord dashboard: Deploy from `/src/landlord_agent/build/`

## Port Configuration

### Change Landlord Dashboard Port

Edit `src/landlord_agent/vite.config.ts`:
```typescript
server: {
  port: 3000, // Change this
  open: true,
},
```

### Change Main App Port

Edit `vite.config.ts` (root):
```typescript
server: {
  port: 5173, // Change this
}
```

## Summary

✅ **Two separate React apps**  
✅ **Run both simultaneously**  
✅ **Share same Firebase/Firestore**  
✅ **Navigation updated to port 3000**  
✅ **Referencing integration working**  

**Landlord Dashboard URL:** `http://localhost:3000` ← Use this!






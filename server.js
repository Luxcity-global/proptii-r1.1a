import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import vendorRoutes from './server/routes/vendors.mjs';

dotenv.config();

const app = express();
const PORT = process.env.VENDOR_BACKEND_PORT || 3001;

app.use(cors());
app.use(express.json());

// Vendor backend for homeowner dashboard (search + saved vendors)
app.use('/api/vendors', vendorRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Vendor backend (homeowner dashboard) running on http://localhost:${PORT}`);
  console.log('  POST /api/vendors/search — vendor search by postcode/category');
  console.log('  GET  /api/vendors/saved  — list saved vendors (header X-User-Id or ?userId=)');
  console.log('  POST /api/vendors/saved — save a vendor');
  console.log('  DELETE /api/vendors/saved/:placeId — remove saved vendor');
});

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8201;

app.use(cors());
app.use(express.json());

// Test route
app.get('/api/v1/v2/assets', (req, res) => {
  console.log('Assets endpoint called!');
  res.json({
    success: true,
    data: [
      {
        id: 'test-1',
        name: 'Test Asset',
        url: '/test.jpg',
        category: 'image',
        created_at: new Date().toISOString()
      }
    ],
    message: 'Test assets retrieved successfully'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Assets API: http://localhost:${PORT}/api/v1/v2/assets`);
});


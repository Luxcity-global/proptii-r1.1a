const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const referencingRoutes = require('./routes/referencingRoutes');
const sql = require('mssql');
const config = require('./config/db');

const app = express();
const port = process.env.PORT || 3002;

app.use(cors({
  origin: 'http://localhost:5173', // Update with your React app URL
  credentials: true
}));
app.use(bodyParser.json());

// Test database connection
sql.connect(config)
  .then(() => {
    console.log('Successfully connected to Azure SQL Database');
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

// API routes
app.use('/api/referencing', referencingRoutes);

// Test route to verify server is running
app.get('/', (req, res) => {
  res.send('Proptii Backend API is running!');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
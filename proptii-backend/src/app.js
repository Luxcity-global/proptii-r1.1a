const express = require('express');
const cors = require('cors');
const referencingRoutes = require('./routes/referencingRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/referencing', referencingRoutes);

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
require('dotenv').config();

const config = {
  server: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  options: {
    encrypt: true, // For Azure SQL
    trustServerCertificate: false
  }
};

module.exports = config;
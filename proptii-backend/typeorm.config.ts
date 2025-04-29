import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Property } from './src/entities/property.entity';
import { Agent } from './src/entities/agent.entity';
import { ViewingRequest } from './src/entities/viewing-request.entity';
import { CreateBookingTables1681651200000 } from './src/migrations/1681651200000-CreateBookingTables';

config();

export default new DataSource({
  type: 'mssql',
  host: process.env.DATABASE_HOST || 'proptii-sql-server.database.windows.net',
  port: 1433,
  username: process.env.DATABASE_USER || 'ProptiiAdminLXC001',
  password: process.env.DATABASE_PASSWORD || 'H0gm@naY007',
  database: process.env.DATABASE_NAME || 'proptii-db',
  entities: [Property, Agent, ViewingRequest],
  migrations: [CreateBookingTables1681651200000],
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  extra: {
    validateConnection: true,
    trustServerCertificate: true
  }
}); 
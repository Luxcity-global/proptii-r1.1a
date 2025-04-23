import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';
import { Property } from '../entities/property.entity';
import { Agent } from '../entities/agent.entity';
import { ViewingRequest } from '../entities/viewing-request.entity';

const logger = new Logger('DatabaseConfig');

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mssql',
  host: 'proptii-sql-server.database.windows.net',
  port: 1433,
  username: 'ProptiiAdminLXC001',
  password: 'H0gm@naY007',
  database: 'proptii-db',
  entities: [Property, Agent, ViewingRequest],
  migrations: ['dist/migrations/*.js'],
  migrationsRun: true,
  synchronize: false,
  options: {
    encrypt: true,
    trustServerCertificate: true
  },
  logging: true,
  logger: 'advanced-console',
  extra: {
    validateConnection: true,
    trustServerCertificate: true
  }
};
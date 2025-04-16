import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';

const logger = new Logger('DatabaseConfig');

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'mssql',
  host: process.env.DATABASE_HOST,
  port: 1433,
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: false,
  migrationsRun: false,
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
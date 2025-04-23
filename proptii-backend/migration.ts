import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dataSource from './typeorm.config';

dataSource.initialize().then(() => {
    console.log('Data Source has been initialized!');
}).catch((err) => {
    console.error('Error during Data Source initialization:', err);
}); 
import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const SeedDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'alan2004',
  database: process.env.DB_DATABASE,
  entities: [__dirname + '/../modules/**/*.entity.{js,ts}'],
  synchronize: true,
  logging: false,
  connectorPackage: 'mysql2',
});

import { join } from 'path';
import { DataSource } from 'typeorm';
import { config as loadEnv } from 'dotenv';

loadEnv();

export default new DataSource({
  type: 'postgres',
  schema: 'public',
  host: process.env.DATABASE_HOST,
  port: Number(process.env.DATABASE_PORT ?? 5432),
  username: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  ssl:
    process.env.DATABASE_SSLMODE === 'require' ||
    process.env.DATABASE_HOST?.includes('neon.tech')
      ? { rejectUnauthorized: false }
      : false,
  entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
  migrations: [join(__dirname, '..', '..', 'migrations', '*.{ts,js}')],
  synchronize: false,
});

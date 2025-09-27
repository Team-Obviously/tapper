import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const databaseUrl = 'postgresql://neondb_owner:npg_Qpn4FhTuJyG0@ep-floral-union-a10stsra-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
if (!databaseUrl) {
    throw new Error('DATABASE_URL is not set');
}

const sql = neon(databaseUrl);

export const db = drizzle({ client: sql, schema });
export type Db = typeof db;



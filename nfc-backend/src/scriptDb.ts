import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as fs from 'fs';

// Read the .env file
let databaseUrl: string;
try {
    const envContent = fs.readFileSync('/Users/soham-bhoir/Desktop/code/eth-global/delhi/nfc-backend/.env', 'utf8');
    const match = envContent.match(/DATABASE_URL=['"]([^'"]+)['"]/);
    if (match && match[1]) {
        databaseUrl = match[1];
        console.log('✅ Set DATABASE_URL from .env file');
    } else {
        throw new Error('Could not extract DATABASE_URL from .env file');
    }
} catch (error) {
    console.error('❌ Failed to read .env file:', error);
    process.exit(1);
}

// Create the database connection
const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });

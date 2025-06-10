// backend/src/database/index.ts
import { Pool } from 'pg';

// Create a connection pool
export const db = new Pool({
  user: process.env.DB_USER || 'taxfolio',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'taxfolio_prod',
  password: process.env.DB_PASSWORD || 'taxfolio22',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test the connection
db.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
  } else {
    console.log('Successfully connected to PostgreSQL database');
    release();
  }
});
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';

// Load database configuration from config.yml
const loadDbConfig = () => {
  try {
    const configPath = path.join(process.cwd(), 'config.yml');
    const config = yaml.load(fs.readFileSync(configPath, 'utf8')) as any;
    return config.db;
  } catch (error) {
    console.error('Error loading database config:', error);
    throw new Error('Failed to load database configuration');
  }
};

const dbConfig = loadDbConfig();

// Create a single pool for the application
const pool = new Pool({
  connectionString: dbConfig.url,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Test the database connection
pool.query('SELECT NOW()')
  .then(() => console.log('Successfully connected to PostgreSQL database'))
  .catch(err => console.error('Database connection error:', err));

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Export a singleton pool instance
export const getPool = (): Pool => {
  return pool;
};

// Get a client from the pool
export const getClient = async (): Promise<PoolClient> => {
  return await pool.connect();
};

// Execute a query with parameters
export const query = async <T extends QueryResultRow = any>(text: string, params: any[] = []): Promise<T[]> => {
  const client = await getClient();
  try {
    const result = await client.query<T>(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Execute a transaction
export const transaction = async <T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Close the pool (useful for tests or when shutting down)
export const closePool = async (): Promise<void> => {
  await pool.end();
};

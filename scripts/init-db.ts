import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';
import { INITIALIZE_DATABASE } from '../lib/schema';

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

async function initializeDatabase() {
  const dbConfig = loadDbConfig();
  const pool = new Pool({
    connectionString: dbConfig.url,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const client = await pool.connect();
  
  try {
    console.log('Initializing database...');
    
    // Execute the initialization SQL in a transaction
    await client.query('BEGIN');
    
    // Split the SQL into individual statements and execute them one by one
    const statements = INITIALIZE_DATABASE.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    for (const statement of statements) {
      try {
        await client.query(statement);
      } catch (error) {
        // Ignore duplicate object errors (like when the extension already exists)
        if (!(error as Error).message.includes('already exists')) {
          throw error;
        }
      }
    }
    
    await client.query('COMMIT');
    
    console.log('✅ Database initialized successfully');
    console.log('\nDefault users created:');
    console.log('🔑 Username: admin');
    console.log('🔑 Username: superadmin');
    console.log('\nPassword for both accounts: admin123');
    console.log('\nPlease change these passwords after your first login!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

// Run the initialization
initializeDatabase().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

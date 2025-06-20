import { query } from './db';
import { CREATE_REVIEWS_TABLE } from './schema';

// Initialize database tables
export async function initializeDatabase() {
  try {
    console.log('Initializing database tables...');
    await query(CREATE_REVIEWS_TABLE);
    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Call this function when the app starts
export default initializeDatabase;

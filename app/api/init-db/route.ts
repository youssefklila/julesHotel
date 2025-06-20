import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { CREATE_REVIEWS_TABLE } from '@/lib/schema';

// This route will be called to initialize the database
export async function GET() {
  try {
    // Execute the CREATE TABLE query using our mock database implementation
    await query(CREATE_REVIEWS_TABLE);
    
    console.log('Database tables initialized successfully (mock)');
    
    return NextResponse.json({ message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Error in database initialization route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

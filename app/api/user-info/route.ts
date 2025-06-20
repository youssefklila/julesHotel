import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '@/lib/db';
import { FIND_USER_BY_USERNAME } from '@/lib/schema';

// GET /api/user-info - Get current user info from cookies
export async function GET(request: NextRequest) {
  try {
    // Get cookies
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('adminAuth')?.value;
    const superAdminAuth = cookieStore.get('superAdminAuth')?.value;
    
    // Check if user is authenticated
    if (!adminAuth && !superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get username from cookies
    let username = '';

    // Check super admin first
    if (superAdminAuth) {
      username = cookieStore.get('superAdminUser')?.value || '';
      // Also check adminUser as fallback
      if (!username) {
        username = cookieStore.get('adminUser')?.value || '';
      }
    } else if (adminAuth) {
      username = cookieStore.get('adminUser')?.value || '';
    }
    
    if (!username) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Get user from database
    const result = await query(FIND_USER_BY_USERNAME, [username]);
    const user = result?.[0];
    
    // User not found
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Return user info without password
    const { password, ...userWithoutPassword } = user;
    
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error getting user info:', error);
    return NextResponse.json(
      { error: 'Failed to get user info' },
      { status: 500 }
    );
  }
}
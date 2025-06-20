import { NextRequest, NextResponse } from 'next/server';
import { User } from '@/lib/user-schema';
import { query } from '@/lib/db';
import { FIND_USER_BY_USERNAME } from '@/lib/schema';
import bcrypt from 'bcrypt';

// SQL query to update user password
const UPDATE_USER_PASSWORD = `
  UPDATE users 
  SET password = $1 
  WHERE id = $2 
  RETURNING id, username, email, role, created_at, updated_at
`;

// POST /api/users/change-password - Change user password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.username || !body.currentPassword || !body.newPassword) {
      return NextResponse.json(
        { error: 'Username, current password, and new password are required' },
        { status: 400 }
      );
    }
    
    // Find the user in the database
    const users = await query<User>(FIND_USER_BY_USERNAME, [body.username]);
    
    // User not found
    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const user = users[0];
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(body.currentPassword, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(body.newPassword, 10);
    
    // Update password in the database
    await query(UPDATE_USER_PASSWORD, [hashedPassword, user.id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}

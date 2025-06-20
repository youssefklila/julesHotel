import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { 
  GET_ALL_USERS, 
  CREATE_USER, 
  UPDATE_USER, 
  DELETE_USER, 
  GET_USER_BY_ID,
  FIND_USER_BY_USERNAME
} from '@/lib/schema';
import bcrypt from 'bcrypt';

// Helper function to hash password
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// GET /api/users - Get all users (requires superadmin)
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = request.cookies;
    const isSuperAdmin = cookieStore.get('superAdminAuth')?.value === 'true';
    
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Super Admin access required' },
        { status: 403 }
      );
    }
    
    // Get users from database
    const users = await query(GET_ALL_USERS);
    
    // Transform the data to use camelCase property names for the frontend
    const transformedUsers = users.map((user: any) => ({
      ...user,
      isActive: user.is_active,
      createdAt: user.created_at,
      lastLogin: user.last_login,
      // Remove the snake_case properties to avoid confusion
      is_active: undefined,
      created_at: undefined,
      last_login: undefined
    }));
    
    return NextResponse.json(transformedUsers || []);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user (requires superadmin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['username', 'password', 'role', 'createdBy'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Check if user already exists
    const existingUser = await query(FIND_USER_BY_USERNAME, [body.username]);
    if (existingUser && existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(body.password);
    
    // Create new user in database
    const newUser = await query(CREATE_USER, [
      body.username,
      hashedPassword,
      body.role,
      body.isActive !== false, // Default to true if not specified
      body.createdBy
    ]);
    
    if (!newUser || newUser.length === 0) {
      throw new Error('Failed to create user');
    }
    
    // Remove password before returning
    const { password, ...userWithoutPassword } = newUser[0];
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// PUT /api/users/:id - Update a user (requires superadmin)
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // Get existing user
    const existingUser = await query(GET_USER_BY_ID, [id]);
    
    if (!existingUser || existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Check if username is being changed and already exists
    if (body.username && body.username !== existingUser[0].username) {
      const userWithSameUsername = await query(FIND_USER_BY_USERNAME, [body.username]);
      if (userWithSameUsername && userWithSameUsername.length > 0) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }
    }
    
    // Prepare update data
    const updateData = {
      username: body.username || undefined,
      role: body.role || undefined,
      is_active: body.isActive !== undefined ? body.isActive : undefined,
      updated_by: body.updatedBy || 'system'
    };
    
    // Hash new password if provided
    let hashedPassword;
    if (body.password) {
      hashedPassword = await hashPassword(body.password);
    }
    
    // Update user in database
    const updatedUser = await query(UPDATE_USER, [
      id,
      updateData.username,
      updateData.role,
      updateData.is_active,
      updateData.updated_by
    ]);
    
    // Update password separately if it was provided
    if (hashedPassword) {
      await query(
        'UPDATE users SET password = $1 WHERE id = $2',
        [hashedPassword, id]
      );
    }
    
    if (!updatedUser || updatedUser.length === 0) {
      throw new Error('Failed to update user');
    }
    
    // Remove password before returning
    const { password, ...userWithoutPassword } = updatedUser[0];
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/:id - Delete a user (requires superadmin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Prevent deleting the default superadmin
    if (id === '00000000-0000-0000-0000-000000000001' || id === '00000000-0000-0000-0000-000000000002') {
      return NextResponse.json(
        { error: 'Cannot delete default admin users' },
        { status: 403 }
      );
    }
    
    // Check if user exists
    const user = await query(GET_USER_BY_ID, [id]);
    if (!user || user.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    // Delete user from database
    const result = await query(DELETE_USER, [id]);
    
    if (!result || result.length === 0) {
      throw new Error('Failed to delete user');
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

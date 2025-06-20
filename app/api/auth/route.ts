import { NextRequest, NextResponse } from 'next/server';
import { UserService } from '@/lib/services/user.service';

// Define the expected request body type
interface LoginRequest {
  username: string;
  password: string;
}

// POST /api/auth - Authenticate a user
export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    
    // Validate required fields
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }
    
    // Find the user by username
    const user = await UserService.findByUsername(body.username);
    
    // User not found
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated' },
        { status: 403 }
      );
    }
    
    // Verify password
    const validUser = await UserService.validateCredentials(body.username, body.password);
    
    if (!validUser) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Update last login
    await UserService.updateLastLogin(user.id);
    
    // Create the response with user data
    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role, // Make sure role is included in the response
        name: user.username, // Using username as name since we don't have a name field
      },
      role: user.role // Also include role at the top level for compatibility
    });
    
    // Set role-specific cookies with proper security flags
    // These cookie names must match what the middleware is expecting
    const cookieOptions = {
      path: '/',
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 // 24 hours
    };

    // Set admin auth cookie
    if (['admin', 'superadmin'].includes(user.role)) {
      response.cookies.set({
        ...cookieOptions,
        name: 'adminAuth',
        value: 'true',
      });
      
      // Set admin role cookie
      response.cookies.set({
        ...cookieOptions,
        name: 'adminRole',
        value: user.role,
      });
      
      // Set username cookie (non-httpOnly for client-side access)
      response.cookies.set({
        ...cookieOptions,
        name: 'adminUser',
        value: user.username,
        httpOnly: false,
      });
    }
    
    // Set super admin specific cookie
    if (user.role === 'superadmin') {
      response.cookies.set({
        ...cookieOptions,
        name: 'superAdminAuth',
        value: 'true',
      });
      // Add this part to set superAdminUser cookie
      response.cookies.set({
        ...cookieOptions,
        name: 'superAdminUser',
        value: user.username,
        httpOnly: true, // Explicitly set httpOnly for security, as it's read server-side
      });
    }
    
    return response;
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}

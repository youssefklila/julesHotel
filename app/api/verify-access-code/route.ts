import { NextRequest, NextResponse } from 'next/server';

// POST /api/verify-access-code - Verify super admin access code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.accessCode) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      );
    }
    
    // In a production environment, this should be stored in environment variables
    // or retrieved from a secure database, not hardcoded
    const validAccessCode = process.env.SUPER_ADMIN_ACCESS_CODE || 'VOTE2024';
    
    // Check if the provided access code matches the valid one
    if (body.accessCode !== validAccessCode) {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      );
    }
    
    // If the access code is valid, return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying access code:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
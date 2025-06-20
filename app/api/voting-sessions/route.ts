import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';

// Helper function to get voting sessions from storage
function getVotingSessionsFromStorage() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'voting-sessions-data.json');
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create file if it doesn't exist
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify([]), 'utf8');
      return [];
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading voting sessions:', error);
    return [];
  }
}

// Helper function to save voting sessions to storage
function saveVotingSessionsToStorage(sessions: any[]) {
  try {
    const filePath = path.join(process.cwd(), 'data', 'voting-sessions-data.json');
    fs.writeFileSync(filePath, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving voting sessions:', error);
  }
}

// Helper function to create an audit log
async function createAuditLog(action: string, details: string, user: string) {
  try {
    const auditLog = {
      id: `audit-${Date.now()}`,
      action,
      user,
      timestamp: new Date().toISOString(),
      details,
    };
    
    const filePath = path.join(process.cwd(), 'data', 'audit-logs-data.json');
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create file if it doesn't exist
    let auditLogs = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      auditLogs = JSON.parse(data);
    }
    
    auditLogs.push(auditLog);
    fs.writeFileSync(filePath, JSON.stringify(auditLogs, null, 2), 'utf8');
  } catch (error) {
    console.error('Error creating audit log:', error);
  }
}

// GET /api/voting-sessions - Get all voting sessions
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('adminAuth')?.value;
    const superAdminAuth = cookieStore.get('superAdminAuth')?.value;
    
    if (!adminAuth && !superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const votingSessions = getVotingSessionsFromStorage();
    return NextResponse.json(votingSessions);
  } catch (error) {
    console.error('Error getting voting sessions:', error);
    return NextResponse.json(
      { error: 'Failed to get voting sessions' },
      { status: 500 }
    );
  }
}

// POST /api/voting-sessions - Create a new voting session
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const superAdminAuth = cookieStore.get('superAdminAuth')?.value;
    
    if (!superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized - Only Super Admins can create voting sessions' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.duration) {
      return NextResponse.json(
        { error: 'Title, description, and duration are required' },
        { status: 400 }
      );
    }
    
    // Get user from cookies
    const username = cookieStore.get('superAdminUser')?.value || 'Unknown Super Admin';
    
    // Create new voting session
    const newSession = {
      id: `session-${Date.now()}`,
      title: body.title,
      description: body.description,
      duration: body.duration,
      status: 'pending',
      startTime: null,
      endTime: null,
      qrCodeUrl: body.qrCodeUrl || null,
      votingUrl: body.votingUrl || null,
      votes: [],
      createdAt: new Date().toISOString(),
      createdBy: username,
    };
    
    // Get existing voting sessions and add the new one
    const votingSessions = getVotingSessionsFromStorage();
    votingSessions.push(newSession);
    
    // Save updated voting sessions
    saveVotingSessionsToStorage(votingSessions);
    
    // Create audit log
    await createAuditLog(
      'VOTING_SESSION_CREATED',
      `Voting session "${newSession.title}" created`,
      username
    );
    
    return NextResponse.json(newSession);
  } catch (error) {
    console.error('Error creating voting session:', error);
    return NextResponse.json(
      { error: 'Failed to create voting session' },
      { status: 500 }
    );
  }
}

// PATCH /api/voting-sessions/:id - Update a voting session
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const superAdminAuth = cookieStore.get('superAdminAuth')?.value;
    
    if (!superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized - Only Super Admins can update voting sessions' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Get existing voting sessions
    const votingSessions = getVotingSessionsFromStorage();
    
    // Find the session to update
    const sessionIndex = votingSessions.findIndex((s: any) => s.id === body.id);
    
    // Session not found
    if (sessionIndex === -1) {
      return NextResponse.json(
        { error: 'Voting session not found' },
        { status: 404 }
      );
    }
    
    // Get user from cookies
    const username = cookieStore.get('superAdminUser')?.value || 'Unknown Super Admin';
    
    // Update the session
    const updatedSession = {
      ...votingSessions[sessionIndex],
      ...body,
    };
    
    votingSessions[sessionIndex] = updatedSession;
    
    // Save updated voting sessions
    saveVotingSessionsToStorage(votingSessions);
    
    // Create audit log
    await createAuditLog(
      'VOTING_SESSION_UPDATED',
      `Voting session "${updatedSession.title}" updated`,
      username
    );
    
    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating voting session:', error);
    return NextResponse.json(
      { error: 'Failed to update voting session' },
      { status: 500 }
    );
  }
}

// DELETE /api/voting-sessions/:id - Delete a voting session
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    const superAdminAuth = cookieStore.get('superAdminAuth')?.value;
    
    if (!superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized - Only Super Admins can delete voting sessions' },
        { status: 401 }
      );
    }
    
    // Get session ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }
    
    // Get existing voting sessions
    const votingSessions = getVotingSessionsFromStorage();
    
    // Find the session to delete
    const sessionIndex = votingSessions.findIndex((s: any) => s.id === id);
    
    // Session not found
    if (sessionIndex === -1) {
      return NextResponse.json(
        { error: 'Voting session not found' },
        { status: 404 }
      );
    }
    
    // Get user from cookies
    const username = cookieStore.get('superAdminUser')?.value || 'Unknown Super Admin';
    
    // Get session title for audit log
    const sessionTitle = votingSessions[sessionIndex].title;
    
    // Remove the session
    votingSessions.splice(sessionIndex, 1);
    
    // Save updated voting sessions
    saveVotingSessionsToStorage(votingSessions);
    
    // Create audit log
    await createAuditLog(
      'VOTING_SESSION_DELETED',
      `Voting session "${sessionTitle}" deleted`,
      username
    );
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting voting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete voting session' },
      { status: 500 }
    );
  }
}
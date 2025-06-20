import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import fs from 'fs';
import path from 'path';
import { query, transaction } from '../../../lib/db';
import {
  VotingSession,
  INSERT_VOTING_SESSION,
  GET_ALL_VOTING_SESSIONS,
  GET_VOTING_SESSION_BY_ID,
  UPDATE_VOTING_SESSION,
  DELETE_VOTING_SESSION_BY_ID,
  GET_USER_ID_BY_USERNAME,
} from '../../../lib/schema';
import { randomUUID } from 'crypto';

// Helper function to create an audit log (remains the same, writes to JSON)
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
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
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
    const cookieStore = await cookies();
    const adminAuth = cookieStore.get('adminAuth')?.value;
    const superAdminAuth = cookieStore.get('superAdminAuth')?.value;

    if (!adminAuth && !superAdminAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await query(GET_ALL_VOTING_SESSIONS);
    const votingSessions: VotingSession[] = result.rows.map(session => ({
      ...session,
      votingUrl: `/vote/${session.unique_link_slug}`,
      qrCodeUrl: `/vote/${session.unique_link_slug}`,
    }));
    
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
    const cookieStore = await cookies();
    const superAdminAuth = cookieStore.get('superAdminAuth')?.value;

    if (!superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized - Only Super Admins can create voting sessions' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, duration, autoStart } = body; // duration is in minutes

    if (!title || !description || typeof duration !== 'number') {
      return NextResponse.json(
        { error: 'Title, description, and duration (number) are required' },
        { status: 400 }
      );
    }

    const username = cookieStore.get('superAdminUser')?.value;
    if (!username) {
      return NextResponse.json({ error: 'Super admin user not found in cookies' }, { status: 403 });
    }

    // Get user ID from username
    const userResult = await query(GET_USER_ID_BY_USERNAME, [username]);
    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found in database' }, { status: 403 });
    }
    const userId = userResult.rows[0].id;

    const unique_link_slug = randomUUID();
    const status = autoStart ? 'active' : 'draft';
    let start_time = null;
    let end_time = null;

    if (autoStart) {
      start_time = new Date().toISOString();
      const endTimeDate = new Date();
      endTimeDate.setMinutes(endTimeDate.getMinutes() + duration);
      end_time = endTimeDate.toISOString();
    }

    const result = await query(INSERT_VOTING_SESSION, [
      title,
      description,
      duration, // duration_minutes
      status,
      start_time,
      end_time,
      unique_link_slug,
      userId, // created_by
    ]);

    const newSession: VotingSession = result.rows[0];

    await createAuditLog(
      'VOTING_SESSION_CREATED',
      `Voting session "${newSession.title}" (ID: ${newSession.id}) created`,
      username
    );
    
    return NextResponse.json({
      ...newSession,
      votingUrl: `/vote/${newSession.unique_link_slug}`,
      qrCodeUrl: `/vote/${newSession.unique_link_slug}`,
    });

  } catch (error) {
    console.error('Error creating voting session:', error);
    return NextResponse.json(
      { error: 'Failed to create voting session' },
      { status: 500 }
    );
  }
}

// PATCH /api/voting-sessions/:id - Update a voting session
// Note: Next.js route should be app/api/voting-sessions/[id]/route.ts for path parameters
// For this example, we'll assume ID comes from request body or query param for simplicity with current file structure.
// If :id is a path parameter, the function signature would be:
// export async function PATCH(request: NextRequest, { params }: { params: { id: string } })
// const id = params.id;
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const superAdminAuth = cookieStore.get('superAdminAuth')?.value;

    if (!superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized - Only Super Admins can update voting sessions' },
        { status: 401 }
      );
    }
    
    const url = new URL(request.url);
    const id = url.searchParams.get('id'); // Assuming ID from query param as per original DELETE

    if (!id) {
      // Try getting from body if not in query (flexible)
      const bodyForId = await request.clone().json(); // Clone request to read body multiple times if needed
      if (!bodyForId.id) {
        return NextResponse.json({ error: 'Session ID is required in query or body' }, { status: 400 });
      }
      // id = bodyForId.id; // This line was problematic, request.json() consumes the body.
      // A better way is to parse body once and use it.
    }
    
    // It's better to expect ID consistently, e.g. from path or query.
    // For this refactor, we'll assume ID is passed as a query parameter for PATCH as well.
    // const { id, ...updateData } = await request.json(); // Original approach in prompt
    // The above line consumes the body. If id is also in body, it's fine.
    // If ID is from query, then:
    const updateData = await request.json();
    const sessionId = id || updateData.id; // Prefer query `id`, fallback to body `id`

    if (!sessionId) {
         return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }


    const { title, description, duration_minutes, status, start_time, end_time } = updateData;

    // Fetch existing session to ensure it exists
    const existingSessionResult = await query(GET_VOTING_SESSION_BY_ID, [sessionId]);
    if (existingSessionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Voting session not found' }, { status: 404 });
    }

    const result = await query(UPDATE_VOTING_SESSION, [
      sessionId,
      title,
      description,
      duration_minutes, // Ensure client sends duration_minutes or map if client sends 'duration'
      status,
      start_time,
      end_time,
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update or find session' }, { status: 404 });
    }
    
    const updatedSession: VotingSession = result.rows[0];
    const username = cookieStore.get('superAdminUser')?.value || 'Unknown Super Admin';

    await createAuditLog(
      'VOTING_SESSION_UPDATED',
      `Voting session "${updatedSession.title}" (ID: ${updatedSession.id}) updated`,
      username
    );

    return NextResponse.json({
      ...updatedSession,
      votingUrl: `/vote/${updatedSession.unique_link_slug}`,
      qrCodeUrl: `/vote/${updatedSession.unique_link_slug}`,
    });

  } catch (error) {
    console.error('Error updating voting session:', error);
    return NextResponse.json(
      { error: 'Failed to update voting session' },
      { status: 500 }
    );
  }
}

// DELETE /api/voting-sessions/:id - Delete a voting session
// Assumes ID is passed as a query parameter: ?id=XXX
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const superAdminAuth = cookieStore.get('superAdminAuth')?.value;

    if (!superAdminAuth) {
      return NextResponse.json(
        { error: 'Unauthorized - Only Super Admins can delete voting sessions' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Session ID is required as a query parameter' }, { status: 400 });
    }

    // Fetch session details for audit log before deleting
    const sessionToDeleteResult = await query(GET_VOTING_SESSION_BY_ID, [id]);
    if (sessionToDeleteResult.rows.length === 0) {
      return NextResponse.json({ error: 'Voting session not found' }, { status: 404 });
    }
    const sessionTitle = sessionToDeleteResult.rows[0].title;

    const result = await query(DELETE_VOTING_SESSION_BY_ID, [id]);

    if (result.rowCount === 0) {
        // This case should ideally be caught by the GET_VOTING_SESSION_BY_ID check,
        // but it's good for robustness.
        return NextResponse.json({ error: 'Voting session not found or already deleted' }, { status: 404 });
    }
    
    const username = cookieStore.get('superAdminUser')?.value || 'Unknown Super Admin';
    await createAuditLog(
      'VOTING_SESSION_DELETED',
      `Voting session "${sessionTitle}" (ID: ${id}) deleted`,
      username
    );

    return NextResponse.json({ success: true, message: `Voting session ${id} deleted` });

  } catch (error) {
    console.error('Error deleting voting session:', error);
    return NextResponse.json(
      { error: 'Failed to delete voting session' },
      { status: 500 }
    );
  }
}
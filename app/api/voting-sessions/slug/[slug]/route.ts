import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../../lib/db'; // Adjusted relative path
import { GET_VOTING_SESSION_BY_SLUG, UPDATE_VOTING_SESSION } from '../../../../../lib/schema'; // Adjusted relative path
import { VotingSession } from '../../../../../lib/schema';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { slug } = params;

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  try {
    const result = await query(GET_VOTING_SESSION_BY_SLUG, [slug]);

    if (result.rows.length === 0) {
      return NextResponse.json({ message: 'Voting session not found.' }, { status: 404 });
    }

    const session: VotingSession = result.rows[0];
    const now = new Date();

    // Ensure dates are ISO strings (pg driver usually does this, but good to be sure)
    const sessionResponse = {
      ...session,
      start_time: session.start_time ? new Date(session.start_time).toISOString() : null,
      end_time: session.end_time ? new Date(session.end_time).toISOString() : null,
      created_at: new Date(session.created_at).toISOString(),
      updated_at: new Date(session.updated_at).toISOString(),
    };

    if (session.status === 'draft') {
      return NextResponse.json({
        message: "Session has not started yet.",
        sessionTitle: session.title,
        status: session.status
      }, { status: 403 });
    }
    if (session.status === 'paused') {
      return NextResponse.json({
        message: "Session is currently paused.",
        sessionTitle: session.title,
        status: session.status
      }, { status: 403 });
    }
    if (session.status === 'completed') {
      return NextResponse.json({
        message: "Session has ended.",
        sessionTitle: session.title,
        status: session.status,
        endTime: sessionResponse.end_time
      }, { status: 410 });
    }
    if (session.status === 'expired') {
      return NextResponse.json({
        message: "Session has expired.",
        sessionTitle: session.title,
        status: session.status,
        endTime: sessionResponse.end_time
      }, { status: 410 });
    }

    if (session.status === 'active') {
      if (session.start_time) {
        const startTime = new Date(session.start_time);
        if (startTime > now) {
          return NextResponse.json({
            message: "Session has not started yet.",
            sessionTitle: session.title,
            status: 'pending_start' // Custom status for client to interpret
          }, { status: 403 });
        }
      }

      if (session.end_time) {
        const endTime = new Date(session.end_time);
        if (endTime <= now) {
          try {
            await query(UPDATE_VOTING_SESSION, [
              session.id, null, null, null, 'expired', null, null
            ]);
          } catch (updateError) {
            console.error(`Failed to update session ${session.id} to expired:`, updateError);
          }
          return NextResponse.json({
            message: "Session has expired.",
            sessionTitle: session.title,
            status: 'expired',
            endTime: sessionResponse.end_time
          }, { status: 410 });
        }
      }
      // Active and current
      return NextResponse.json(sessionResponse);
    }

    // Fallback for any other unexpected status
    return NextResponse.json({ message: 'Voting session is not available for voting at this time.' }, { status: 403 });

  } catch (error) {
    console.error('Error fetching session by slug:', error);
    return NextResponse.json({ message: 'Internal server error while fetching session details.' }, { status: 500 });
  }
}

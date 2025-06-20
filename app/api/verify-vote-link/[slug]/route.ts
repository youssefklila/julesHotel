import { NextRequest, NextResponse } from 'next/server';
import { query } from '../../../../lib/db'; // Adjusted relative path
import { GET_VOTING_SESSION_BY_SLUG, UPDATE_VOTING_SESSION } from '../../../../lib/schema'; // Adjusted relative path
import { VotingSession } from '../../../../lib/schema'; // Assuming VotingSession interface is also in schema.ts

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
      return NextResponse.json({ error: 'Voting session not found' }, { status: 404 });
    }

    const session: VotingSession = result.rows[0];
    const now = new Date();

    // Validate session status and time
    if (session.status === 'draft') {
      return NextResponse.json({ error: 'Voting session is not yet active.' }, { status: 403 });
    }
    if (session.status === 'paused') {
      return NextResponse.json({ error: 'Voting session is currently paused.' }, { status: 403 });
    }
    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Voting session has been completed.' }, { status: 410 }); // 410 Gone
    }
    if (session.status === 'expired') {
      return NextResponse.json({ error: 'Voting session has expired.' }, { status: 410 }); // 410 Gone
    }

    if (session.status === 'active') {
      if (session.start_time) {
        const startTime = new Date(session.start_time);
        if (startTime > now) {
          return NextResponse.json({ error: 'Voting session has not started yet.' }, { status: 403 });
        }
      }

      if (session.end_time) {
        const endTime = new Date(session.end_time);
        if (endTime <= now) {
          // Session has expired, update status to 'expired'
          try {
            await query(UPDATE_VOTING_SESSION, [
              session.id, null, null, null, 'expired', null, null // Only update status and updated_at (implicitly by query)
            ]);
          } catch (updateError) {
            console.error(`Failed to update session ${session.id} to expired:`, updateError);
            // Continue to return 410, but log the error
          }
          return NextResponse.json({ error: 'Voting session has expired.' }, { status: 410 });
        }
      }
      // If active and current time is within start_time and end_time (or start_time is null)
      return NextResponse.json({ isValid: true, title: session.title, id: session.id });
    }

    // Fallback for any other unexpected status
    return NextResponse.json({ error: 'Voting session is not available.' }, { status: 403 });

  } catch (error) {
    console.error('Error verifying vote link:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

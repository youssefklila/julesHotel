import { POST } from './route'; // Assuming POST is exported from your route file
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { query } from '../../../lib/db'; // Path to your db query function
import { randomUUID } from 'crypto';

// Mock an external dependency: the 'query' function from your database library
jest.mock('../../../lib/db', () => ({
  query: jest.fn(),
  transaction: jest.fn(), // Assuming transaction might also be there
}));

// Mock 'next/headers'
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock 'crypto' for randomUUID if needed for predictable slugs, though not strictly necessary for these tests
jest.mock('crypto', () => ({
  ...jest.requireActual('crypto'), // import and retain default behavior
  randomUUID: jest.fn().mockReturnValue('mock-uuid-1234'),
}));

// Mock fs and path for createAuditLog to prevent actual file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
}));
jest.mock('path', () => ({
  ...jest.requireActual('path'), // import and retain default behavior
  join: jest.fn((...args) => args.join('/')), // Simple mock for join
  dirname: jest.fn(filePath => filePath.substring(0, filePath.lastIndexOf('/'))),
}));


describe('POST /api/voting-sessions', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test Case 1: Successful Voting Session Creation
  it('should create a voting session successfully when user exists', async () => {
    // Mock preconditions
    (cookies as jest.Mock).mockReturnValue({
      get: (name: string) => {
        if (name === 'superAdminAuth') return { value: 'valid-superadmin-token' };
        if (name === 'superAdminUser') return { value: 'testsuperadmin' };
        return undefined;
      },
    });

    (query as jest.Mock).mockResolvedValueOnce({ // For GET_USER_ID_BY_USERNAME
      rows: [{ id: 'user-id-123' }],
      rowCount: 1,
    });

    // This is what the DB query for INSERT_VOTING_SESSION is expected to return
    // The start_time and end_time in this mock will be used to construct the response.
    // The actual values sent to the DB are generated within the POST handler.
    const dbInsertResultMock = {
      id: 'session-id-5678',
      title: 'Test Session',
      description: 'A session for testing',
      duration_minutes: 60,
      status: 'active',
      // These values will be part of the response, but the ones sent to DB are generated dynamically
      start_time: new Date().toISOString(),
      end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      unique_link_slug: 'mock-uuid-1234',
      created_by: 'user-id-123',
    };
    (query as jest.Mock).mockResolvedValueOnce({ // For INSERT_VOTING_SESSION
      rows: [dbInsertResultMock],
      rowCount: 1,
    });

    (jest.requireMock('fs').existsSync as jest.Mock).mockReturnValue(false);

    const requestBody = {
      title: 'Test Session',
      description: 'A session for testing',
      duration: 60,
      autoStart: true,
    };
    const req = new NextRequest('http://localhost/api/voting-sessions', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req as NextRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(200);
    expect(responseBody).toEqual(expect.objectContaining({
      id: 'session-id-5678',
      title: 'Test Session',
      description: 'A session for testing',
      duration_minutes: 60,
      status: 'active',
      unique_link_slug: 'mock-uuid-1234',
      created_by: 'user-id-123',
      start_time: expect.any(String),
      end_time: expect.any(String),
      votingUrl: `/vote/mock-uuid-1234`,
      qrCodeUrl: `/vote/mock-uuid-1234`,
    }));

    expect(new Date(responseBody.start_time).toISOString()).toBe(responseBody.start_time);
    expect(new Date(responseBody.end_time).toISOString()).toBe(responseBody.end_time);

    expect(query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT id FROM users WHERE username = $1'), ['testsuperadmin']);
    // For the INSERT query, start_time and end_time are generated within the handler, so we use expect.any(String)
    expect(query).toHaveBeenNthCalledWith(2,
      expect.stringContaining('INSERT INTO voting_sessions'),
      [
        requestBody.title,
        requestBody.description,
        requestBody.duration,
        'active',
        expect.any(String), // Corrected: dynamically generated in handler
        expect.any(String), // Corrected: dynamically generated in handler
        'mock-uuid-1234',
        'user-id-123',
      ]
    );

    expect(jest.requireMock('fs').writeFileSync).toHaveBeenCalled();
  });

  // Test Case 2: User Not Found in Database (Existing Logic)
  it('should return 403 if user not found in database', async () => {
    // Mock preconditions
    (cookies as jest.Mock).mockReturnValue({
      get: (name: string) => {
        if (name === 'superAdminAuth') return { value: 'valid-superadmin-token' };
        if (name === 'superAdminUser') return { value: 'nonexistentuser' };
        return undefined;
      },
    });

    (query as jest.Mock).mockResolvedValueOnce({
      rows: [],
      rowCount: 0,
    });

    const requestBody = {
      title: 'Test Session',
      description: 'A session for testing',
      duration: 60,
      autoStart: true,
    };
    const req = new NextRequest('http://localhost/api/voting-sessions', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req as NextRequest);
    const responseBody = await response.json();

    expect(response.status).toBe(403);
    expect(responseBody).toEqual({ error: 'User not found in database' });

    expect(query).toHaveBeenCalledWith(expect.stringContaining('SELECT id FROM users WHERE username = $1'), ['nonexistentuser']);
    expect(query).toHaveBeenCalledTimes(1);

    expect(jest.requireMock('fs').writeFileSync).not.toHaveBeenCalled();
  });
});

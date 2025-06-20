// Database schema definitions for the hotel rating app

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'superadmin' | 'user';
  is_active: boolean;
  created_at: string;
  created_by: string;
  last_login?: string;
  updated_at?: string;
  updated_by?: string;
}

export interface Review {
  id: string;
  fullName: string;
  nationality: string;
  age: number;
  roomNumber: string;
  submittedAt: string;
  overallRating: number;
  recommend: boolean;
  visitAgain: boolean;
  services: Record<string, { rating: number; comment?: string }>;
  suggestions?: string;
}

export interface VotingSession {
  id: string;
  title: string;
  description?: string;
  duration_minutes: number;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'expired';
  start_time?: string;
  end_time?: string;
  unique_link_slug: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

// SQL to create the users table
export const CREATE_USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'superadmin', 'user')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  updated_by VARCHAR(50)
);
`;

// SQL to create the reviews table
export const CREATE_REVIEWS_TABLE = `
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  nationality TEXT NOT NULL,
  age INTEGER NOT NULL,
  room_number TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 10),
  recommend BOOLEAN NOT NULL,
  visit_again BOOLEAN NOT NULL,
  services JSONB NOT NULL,
  suggestions TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`;

// SQL to create the voting_sessions table
export const CREATE_VOTING_SESSIONS_TABLE = `
CREATE TABLE IF NOT EXISTS voting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'expired')),
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  unique_link_slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_voting_sessions_unique_link_slug ON voting_sessions(unique_link_slug);
`;

// SQL to get user ID by username
export const GET_USER_ID_BY_USERNAME = `
SELECT id FROM users WHERE username = $1;
`;

// SQL to insert a new voting session
export const INSERT_VOTING_SESSION = `
INSERT INTO voting_sessions (
  title, description, duration_minutes, status, start_time, end_time, unique_link_slug, created_by
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;
`;

// SQL to get all voting sessions
export const GET_ALL_VOTING_SESSIONS = `
SELECT * FROM voting_sessions ORDER BY created_at DESC;
`;

// SQL to get a voting session by ID
export const GET_VOTING_SESSION_BY_ID = `
SELECT * FROM voting_sessions WHERE id = $1;
`;

// SQL to get a voting session by unique_link_slug
export const GET_VOTING_SESSION_BY_SLUG = `
SELECT id, title, description, duration_minutes, status, start_time, end_time, unique_link_slug, created_at, created_by
FROM voting_sessions
WHERE unique_link_slug = $1;
`;

// SQL to update a voting session
export const UPDATE_VOTING_SESSION = `
UPDATE voting_sessions
SET
  title = COALESCE($2, title),
  description = COALESCE($3, description),
  duration_minutes = COALESCE($4, duration_minutes),
  status = COALESCE($5, status),
  start_time = COALESCE($6, start_time),
  end_time = COALESCE($7, end_time),
  updated_at = NOW()
WHERE id = $1
RETURNING *;
`;

// SQL to delete a voting session by ID
export const DELETE_VOTING_SESSION_BY_ID = `
DELETE FROM voting_sessions WHERE id = $1 RETURNING id;
`;

// SQL to insert a new user
export const INSERT_USER = `
INSERT INTO users (
  username, password, role, is_active, created_by, last_login
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id, username, role, is_active, created_at, last_login;
`;

// SQL to find user by username
export const FIND_USER_BY_USERNAME = `
SELECT * FROM users WHERE username = $1;
`;

// SQL to update user last login
export const UPDATE_USER_LAST_LOGIN = `
UPDATE users 
SET last_login = NOW() 
WHERE id = $1 
RETURNING *;
`;

// SQL to insert a new review
export const INSERT_REVIEW = `
INSERT INTO reviews (
  full_name, nationality, age, room_number, 
  overall_rating, recommend, visit_again, services, suggestions, created_by
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;
`;

// SQL to get all users
export const GET_ALL_USERS = `
SELECT 
  id,
  username,
  role,
  is_active,
  created_at,
  created_by,
  last_login,
  updated_at,
  updated_by
FROM users
ORDER BY created_at DESC;
`;

// SQL to create a new user
export const CREATE_USER = `
INSERT INTO users (
  username, 
  password, 
  role, 
  is_active, 
  created_by
) VALUES ($1, $2, $3, $4, $5)
RETURNING *;
`;

// SQL to update a user
export const UPDATE_USER = `
UPDATE users
SET 
  username = COALESCE($2, username),
  role = COALESCE($3, role),
  is_active = COALESCE($4, is_active),
  updated_at = NOW(),
  updated_by = $5
WHERE id = $1
RETURNING *;
`;

// SQL to delete a user
export const DELETE_USER = `
DELETE FROM users 
WHERE id = $1 
RETURNING id;
`;

// SQL to get user by ID
export const GET_USER_BY_ID = `
SELECT * FROM users WHERE id = $1;
`;

// SQL to get all reviews with pagination
export const GET_ALL_REVIEWS = `
SELECT 
  r.*,
  u.username as created_by_username
FROM reviews r
LEFT JOIN users u ON r.created_by = u.id
ORDER BY r.submitted_at DESC
LIMIT $1 OFFSET $2;
`;

// SQL to count all reviews (for pagination)
export const COUNT_ALL_REVIEWS = `
SELECT COUNT(*) as total FROM reviews;
`;

// SQL to get a review by ID
export const GET_REVIEW_BY_ID = `
SELECT 
  r.*,
  u.username as created_by_username
FROM reviews r
LEFT JOIN users u ON r.created_by = u.id
WHERE r.id = $1;
`;

// SQL to initialize the database with default admin users
export const INITIALIZE_DATABASE = `
-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if not exists
${CREATE_USERS_TABLE}

-- Create reviews table if not exists
${CREATE_REVIEWS_TABLE}

-- Create voting_sessions table if not exists
${CREATE_VOTING_SESSIONS_TABLE}

-- Create default admin and superadmin users if they don't exist
INSERT INTO users (id, username, password, role, is_active, created_by, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin', '$2b$10$GlsGSNhkbSVsH3IUfLmsnOifldwFZUSjB3vLZ5QHChAKKXqyQ2qQe', 'admin', true, 'system', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'superadmin', '$2b$10$GlsGSNhkbSVsH3IUfLmsnOifldwFZUSjB3vLZ5QHChAKKXqyQ2qQe', 'superadmin', true, 'system', NOW())
ON CONFLICT (username) DO NOTHING;
`;

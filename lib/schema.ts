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

-- Create default admin and superadmin users if they don't exist
INSERT INTO users (id, username, password, role, is_active, created_by, created_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin', '$2b$10$GlsGSNhkbSVsH3IUfLmsnOifldwFZUSjB3vLZ5QHChAKKXqyQ2qQe', 'admin', true, 'system', NOW()),
  ('00000000-0000-0000-0000-000000000002', 'superadmin', '$2b$10$GlsGSNhkbSVsH3IUfLmsnOifldwFZUSjB3vLZ5QHChAKKXqyQ2qQe', 'superadmin', true, 'system', NOW())
ON CONFLICT (username) DO NOTHING;
`;

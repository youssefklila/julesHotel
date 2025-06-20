// User management schema definitions for the hotel rating app

export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'superadmin';
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  lastLogin?: string;
}

// SQL to create the users table (for reference, we're using file-based storage)
export const CREATE_USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'superadmin')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE
);
`;

// SQL to insert a new user (for reference)
export const INSERT_USER = `
INSERT INTO users (
  username, password, role, is_active, created_by
) VALUES ($1, $2, $3, $4, $5)
RETURNING *;
`;

// SQL to get all users (for reference)
export const GET_ALL_USERS = `
SELECT * FROM users ORDER BY created_at DESC;
`;

// SQL to get a user by username (for reference)
export const GET_USER_BY_USERNAME = `
SELECT * FROM users WHERE username = $1;
`;

// SQL to update a user (for reference)
export const UPDATE_USER = `
UPDATE users
SET username = $1, password = $2, role = $3, is_active = $4
WHERE id = $5
RETURNING *;
`;

// SQL to delete a user (for reference)
export const DELETE_USER = `
DELETE FROM users WHERE id = $1;
`;

// SQL to update user's last login (for reference)
export const UPDATE_USER_LAST_LOGIN = `
UPDATE users
SET last_login = NOW()
WHERE id = $1;
`;

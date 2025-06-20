# Database Setup Guide

This guide will help you set up and use the PostgreSQL database for the Hotels application.

## Prerequisites

1. PostgreSQL installed and running
2. A database created for the application
3. Node.js and npm installed

## Configuration

1. Update the `config.yml` file with your PostgreSQL connection details:

```yaml
db:
  url: "postgresql://postgres:2025@127.0.0.1:5432/hotel"
```

## Initial Setup

1. Install dependencies:

```bash
npm install
```

2. Initialize the database (this will create tables and default users):

```bash
npm run db:init
```

This will create:
- A `users` table with default admin and superadmin accounts
- A `reviews` table for storing guest reviews

## Default Users

After initialization, two default users will be created:

1. **Admin User**
   - Username: `admin`
   - Password: `admin123`
   - Role: `admin`

2. **Super Admin User**
   - Username: `superadmin`
   - Password: `admin123`
   - Role: `superadmin`

**Important:** Change these passwords after your first login!

## Database Schema

### Users Table

```sql
CREATE TABLE users (
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
```

### Reviews Table

```sql
CREATE TABLE reviews (
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
```

## Troubleshooting

### Database Connection Issues

1. Verify that PostgreSQL is running
2. Check the connection string in `config.yml`
3. Ensure the database user has the correct permissions

### Database Management

### Available Scripts

- `npm run db:setup` - Interactive setup for database configuration
- `npm run db:init` - Initialize database with default tables and users
- `npm run db:backup` - Create a backup of the database

### Setup

1. Run the setup script to configure your database connection:
   ```bash
   npm run db:setup
   ```
   This will guide you through the process of setting up your database configuration.

2. Initialize the database with default tables and users:
   ```bash
   npm run db:init
   ```

### Backups

To create a backup of your database:

```bash
npm run db:backup
```

This will create a timestamped SQL dump file in the `backups` directory.

### Reset the Database

To reset the database (this will delete all data):

1. Drop and recreate your database
2. Run `npm run db:init` again

## Security Notes

1. Never commit sensitive information like database passwords to version control
2. Use environment variables for production credentials
3. Change default passwords immediately after setup
4. Regularly backup your database

## Backups

It's recommended to set up regular database backups. Here's a simple backup command:

```bash
pg_dump -U your_username -d your_database_name -f backup_$(date +%Y%m%d).sql
```

## Support

For additional help, please contact your system administrator or open an issue in the project repository.

-- Migration: Add email column to users table
-- Run this SQL script to add the email column to your users table

-- Add email column to users table
ALTER TABLE users 
ADD COLUMN email VARCHAR(255) NULL AFTER contact_no;

-- Add unique constraint on email (optional - uncomment if you want unique emails)
-- ALTER TABLE users ADD UNIQUE KEY unique_email (email);

-- Add index on email for better query performance
CREATE INDEX idx_email ON users(email);

-- Update existing users with a placeholder email if needed (optional)
-- UPDATE users SET email = CONCAT(username, '@example.com') WHERE email IS NULL;


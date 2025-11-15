-- Migration script to add device_id support for multi-device session management
-- Run this SQL script on your database

-- 1. Add device_id column to users table (if not exists)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS device_id VARCHAR(255) NULL AFTER loginstatus;

-- 2. Create user_sessions table to track active sessions per device
CREATE TABLE IF NOT EXISTS user_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  device_id VARCHAR(255) NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_device (user_id, device_id),
  KEY idx_user_id (user_id),
  KEY idx_device_id (device_id),
  KEY idx_is_active (is_active),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_active_sessions ON user_sessions(user_id, is_active);

-- Note: If your MySQL version doesn't support IF NOT EXISTS, remove it and run manually
-- For older MySQL versions, you may need to check if columns/tables exist before creating


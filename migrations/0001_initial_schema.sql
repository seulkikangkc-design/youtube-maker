-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  credits INTEGER NOT NULL DEFAULT 1000,
  videos_created INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME
);

-- VideoLog table
CREATE TABLE IF NOT EXISTS video_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  keyword TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  analysis_result TEXT, -- JSON string with YouTube and Gemini analysis results
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- CreditLog table
CREATE TABLE IF NOT EXISTS credit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  change_amount INTEGER NOT NULL, -- positive or negative
  reason TEXT NOT NULL,
  admin_id INTEGER, -- nullable, only set when admin adjusts credits
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_video_logs_user_id ON video_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_video_logs_status ON video_logs(status);
CREATE INDEX IF NOT EXISTS idx_credit_logs_user_id ON credit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_logs_created_at ON credit_logs(created_at);

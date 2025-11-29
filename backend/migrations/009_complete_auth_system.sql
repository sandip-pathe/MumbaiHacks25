-- Complete Auth System Migration
-- Adds password authentication and Jira OAuth support

-- Add password field to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS company_name VARCHAR(500),
ADD COLUMN IF NOT EXISTS company_type VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- Add Jira OAuth fields
ALTER TABLE users
ADD COLUMN IF NOT EXISTS jira_cloud_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS jira_access_token TEXT,
ADD COLUMN IF NOT EXISTS jira_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS jira_token_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS jira_site_url TEXT,
ADD COLUMN IF NOT EXISTS jira_site_name VARCHAR(500);

-- Create sessions table for managing user sessions
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    user_agent TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Create oauth_connections table to track multiple OAuth providers
CREATE TABLE IF NOT EXISTS oauth_connections (
    connection_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'github', 'jira'
    provider_user_id VARCHAR(255),
    provider_username VARCHAR(255),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    scopes TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

CREATE INDEX idx_oauth_user ON oauth_connections(user_id);
CREATE INDEX idx_oauth_provider ON oauth_connections(provider);
CREATE INDEX idx_oauth_provider_user ON oauth_connections(provider, provider_user_id);

-- Update user_repos to reference oauth_connections instead of storing token directly
ALTER TABLE user_repos
DROP COLUMN IF EXISTS github_access_token;

-- Add email unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email) WHERE email IS NOT NULL;

-- Create function to hash password (using pgcrypto extension)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Update trigger for oauth_connections
CREATE TRIGGER update_oauth_connections_updated_at BEFORE UPDATE ON oauth_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'User accounts with email/password and OAuth support';
COMMENT ON TABLE sessions IS 'Active user sessions for JWT token management';
COMMENT ON TABLE oauth_connections IS 'OAuth provider connections (GitHub, Jira, etc.)';
COMMENT ON COLUMN users.password_hash IS 'bcrypt hashed password';
COMMENT ON COLUMN oauth_connections.access_token IS 'Encrypted OAuth access token';
COMMENT ON COLUMN oauth_connections.refresh_token IS 'Encrypted OAuth refresh token';

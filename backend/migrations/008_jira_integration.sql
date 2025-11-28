-- Jira Integration Tables
-- Migration: 008_jira_integration.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Store per-user Jira OAuth credentials
CREATE TABLE IF NOT EXISTS jira_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    cloud_id TEXT NOT NULL,
    site_url TEXT NOT NULL,
    site_name TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Store Jira tickets created from violations
CREATE TABLE IF NOT EXISTS jira_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    violation_id UUID NOT NULL,
    case_id UUID REFERENCES audit_cases(case_id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    
    -- Jira ticket details
    jira_ticket_id TEXT NOT NULL,
    jira_ticket_key TEXT NOT NULL,
    jira_ticket_url TEXT NOT NULL,
    project_key TEXT NOT NULL,
    
    -- Ticket metadata
    issue_type TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL,  -- To Do, In Progress, Done, etc.
    assignee TEXT,
    
    -- Sync tracking
    last_synced_at TIMESTAMP DEFAULT NOW(),
    sync_status TEXT DEFAULT 'active',  -- active, failed, closed
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jira_credentials_user ON jira_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_violation ON jira_tickets(violation_id);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_case ON jira_tickets(case_id);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_user ON jira_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_status ON jira_tickets(status);
CREATE INDEX IF NOT EXISTS idx_jira_tickets_key ON jira_tickets(jira_ticket_key);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_jira_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jira_credentials_updated_at
BEFORE UPDATE ON jira_credentials
FOR EACH ROW
EXECUTE FUNCTION update_jira_credentials_updated_at();

CREATE OR REPLACE FUNCTION update_jira_tickets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jira_tickets_updated_at
BEFORE UPDATE ON jira_tickets
FOR EACH ROW
EXECUTE FUNCTION update_jira_tickets_updated_at();

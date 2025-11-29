import {
  GitHubRepo,
  IndexingStatus,
  RegulationDoc,
  ScanStatus,
  ScrapeResult,
  User,
  Violation,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const apiClient = {
  // Get GitHub OAuth authorization URL
  async getGitHubAuthUrl(redirectUri: string, state?: string) {
    const response = await fetch(`${API_URL}/auth/github/authorize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ redirect_uri: redirectUri, state }),
    });
    if (!response.ok) throw new Error("Failed to get auth URL");
    return response.json() as Promise<{ authorization_url: string }>;
  },

  // Exchange GitHub OAuth code for token
  async exchangeGitHubCode(code: string, redirectUri: string) {
    const response = await fetch(
      `${API_URL}/auth/github/callback?code=${encodeURIComponent(
        code
      )}&redirect_uri=${encodeURIComponent(redirectUri)}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!response.ok) throw new Error("Failed to exchange code");
    return response.json() as Promise<{
      access_token: string;
      user: {
        id: number;
        login: string;
        name: string | null;
        email: string | null;
        avatar_url: string;
      };
    }>;
  },

  async getMe(token: string) {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch user");
    return res.json() as Promise<User>;
  },

  // Email/password signup
  signup: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("Signup failed");
    return response.json() as Promise<{ access_token: string }>;
  },

  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error("Login failed");
    return response.json() as Promise<{ access_token: string }>;
  },

  // List user's GitHub repositories
  async listUserRepos(stackAuthToken: string) {
    console.log("[FRONTEND] Fetching /user/repos...");
    const response = await fetch(`${API_URL}/user/repos`, {
      headers: { Authorization: `Bearer ${stackAuthToken}` },
    });
    console.log("[FRONTEND] Response status:", response.status);
    const data = await response.json();
    console.log("[FRONTEND] Repositories data:", data);
    if (!response.ok) throw new Error("Failed to list repos");
    return data as { repos: GitHubRepo[]; total: number };
  },

  // Index selected repositories
  async indexRepositories(accessToken: string, repoIds: number[]) {
    const response = await fetch(`${API_URL}/user/repos/index`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ repo_ids: repoIds, access_token: accessToken }),
    });
    if (!response.ok) throw new Error("Failed to index repos");
    return response.json() as Promise<{
      success: boolean;
      message: string;
      repos: Array<{ id: number; full_name: string; status: string }>;
    }>;
  },

  // Get repository indexing status
  async getRepoStatus(repoId: number, stackAuthToken: string) {
    const response = await fetch(`${API_URL}/user/repos/${repoId}/status`, {
      headers: { Authorization: `Bearer ${stackAuthToken}` },
    });
    if (!response.ok) throw new Error("Failed to get repo status");
    return response.json() as Promise<IndexingStatus>;
  },

  // --- Regulation Engine Endpoints ---

  // DEMO MODE: Preload Regulation
  async preloadDemoRegulation() {
    const response = await fetch(`${API_URL}/regulations/preload-demo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to preload demo regulation");
    return response.json() as Promise<{
      message: string;
      data: {
        rule_id: string;
        title: string;
        chunk_count: number;
        status: "already_loaded" | "newly_loaded";
      };
    }>;
  },

  // DEMO MODE: Get Regulation Metadata
  async getDemoRegulationMetadata() {
    const response = await fetch(
      `${API_URL}/regulations/preload-demo/metadata`
    );
    if (!response.ok) throw new Error("Failed to get demo regulation metadata");
    return response.json() as Promise<{
      message: string;
      data: {
        rule_id: string;
        title: string;
        category: string;
        severity: string;
        chunk_count: number;
        regulatory_body: string;
      };
    }>;
  },

  // Manual Upload (DISABLED FOR DEMO)
  async uploadRegulation(formData: FormData, adminKey: string) {
    // ⚠️ This endpoint is disabled in demo mode
    const response = await fetch(`${API_URL}/regulations/upload`, {
      method: "POST",
      headers: {
        "X-API-Key": adminKey,
      },
      body: formData,
    });
    if (!response.ok) throw new Error("Upload disabled for demo");
    return response.json() as Promise<{
      message: string;
      data: { id: string };
    }>;
  },

  // Trigger RSS Scraper
  async triggerRSS(adminKey: string) {
    const response = await fetch(`${API_URL}/regulations/rss/trigger`, {
      method: "POST",
      headers: { "X-API-Key": adminKey },
    });
    if (!response.ok) throw new Error("RSS trigger failed");
    return response.json() as Promise<{ message: string; data: ScrapeResult }>;
  },

  // --- Scans & Agents ---

  async getScanStatus(scanId: string, token: string) {
    // In a real app, we'd have a specific endpoint for logs,
    // but for now we might fetch scan details or generic status
    const res = await fetch(`${API_URL}/analyze/scan/${scanId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch scan status");
    return res.json() as Promise<ScanStatus>;
  },

  // Get Review Queue (Drafts)
  // Note: using the admin regulations endpoint or a specific one if created
  async getReviewQueue(adminKey: string) {
    // For now, we might need to filter the list if the backend doesn't have a specific /review-queue endpoint yet
    // Or we assume /regulations returns all and we filter on client if needed
    // But based on previous context, we added /regulations/review-queue
    const response = await fetch(`${API_URL}/regulations/review-queue`, {
      headers: { "X-API-Key": adminKey },
    });
    if (!response.ok) return []; // Return empty if endpoint not ready
    return response.json() as Promise<RegulationDoc[]>;
  },

  // --- Violations (Review Queue) ---

  async getPendingViolations(token: string) {
    const res = await fetch(`${API_URL}/violations/pending`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch violations");
    return res.json() as Promise<Violation[]>;
  },

  async updateViolationStatus(
    violationId: string,
    status: "approved" | "rejected" | "ignored",
    note: string,
    token: string
  ) {
    const res = await fetch(`${API_URL}/violations/${violationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status, note }),
    });
    if (!res.ok) throw new Error("Failed to update violation");
    return res.json() as Promise<Violation>;
  },

  async createJiraTicket(violationId: string, token: string) {
    const res = await fetch(`${API_URL}/integrations/jira/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ violation_id: violationId }),
    });
    if (!res.ok) throw new Error("Failed to create Jira ticket");
    return res.json() as Promise<{ ticket_id: string; ticket_url: string }>;
  },

  // --- Jira OAuth 2.0 Integration ---

  async getJiraAuthUrl(userId: string) {
    const res = await fetch(
      `${API_URL}/api/jira/connect?user_id=${encodeURIComponent(userId)}`
    );
    if (!res.ok) throw new Error("Failed to get Jira auth URL");
    return res.json() as Promise<{ authorization_url: string }>;
  },

  async getJiraStatus(userId: string) {
    const res = await fetch(
      `${API_URL}/api/jira/status?user_id=${encodeURIComponent(userId)}`
    );
    if (!res.ok) return { connected: false };
    return res.json() as Promise<{
      connected: boolean;
      site_url?: string;
      site_name?: string;
      expires_at?: string;
    }>;
  },

  async disconnectJira(userId: string) {
    const res = await fetch(
      `${API_URL}/api/jira/disconnect?user_id=${encodeURIComponent(userId)}`,
      {
        method: "DELETE",
      }
    );
    if (!res.ok) throw new Error("Failed to disconnect Jira");
    return res.json();
  },

  async createJiraTicketFromViolation(data: {
    user_id: string;
    violation_id: string;
    project_key: string;
    issue_type: string;
    priority: string;
    assignee?: string;
  }) {
    const res = await fetch(`${API_URL}/api/jira/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create Jira ticket");
    return res.json() as Promise<{
      id: string;
      jira_ticket_id: string;
      jira_ticket_key: string;
      jira_ticket_url: string;
      status: string;
    }>;
  },

  async bulkCreateJiraTickets(data: {
    user_id: string;
    case_id: string;
    project_key: string;
    issue_type: string;
    priority: string;
  }) {
    const res = await fetch(`${API_URL}/api/jira/tickets/bulk-create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to bulk create Jira tickets");
    return res.json() as Promise<{
      created_count: number;
      tickets: Array<{
        jira_ticket_key: string;
        jira_ticket_url: string;
      }>;
    }>;
  },

  // --- MCP Orchestration & Scanning ---

  async runAudit(repoId: string, userId: string) {
    const res = await fetch(`${API_URL}/mcp/run_audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ repo_id: repoId, user_id: userId }),
    });
    if (!res.ok) throw new Error("Failed to start audit");
    return res.json() as Promise<{
      case_id: string;
      status: string;
      message: string;
    }>;
  },

  async getAuditStatus(caseId: string) {
    const res = await fetch(`${API_URL}/mcp/audit_status/${caseId}`);
    if (!res.ok) throw new Error("Failed to get audit status");
    return res.json() as Promise<{
      case_id: string;
      repo_id: string;
      status: "pending" | "running" | "completed" | "failed" | "hitl_review";
      current_step: number;
      workflow_steps: string[];
      agent_outputs: Record<string, any>;
      violations_found: number;
      hitl_approved: boolean | null;
      created_at: string;
      updated_at: string;
    }>;
  },

  async resumeAudit(caseId: string) {
    const res = await fetch(`${API_URL}/mcp/resume_audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseId }),
    });
    if (!res.ok) throw new Error("Failed to resume audit");
    return res.json();
  },

  // --- HITL Review Tools ---

  async explainViolation(violationId: string, userQuery?: string) {
    const res = await fetch(`${API_URL}/hitl/explain`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        violation_id: violationId,
        user_query: userQuery || "Explain this violation in detail",
      }),
    });
    if (!res.ok) throw new Error("Failed to get explanation");
    return res.json() as Promise<{
      violation_id: string;
      explanation: string;
    }>;
  },

  async suggestFix(violationId: string) {
    const res = await fetch(`${API_URL}/hitl/suggest_fix`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ violation_id: violationId }),
    });
    if (!res.ok) throw new Error("Failed to get fix suggestion");
    return res.json() as Promise<{
      violation_id: string;
      suggested_code: string;
      explanation: string;
    }>;
  },

  async submitReviewDecision(data: {
    violation_id: string;
    decision: "approve" | "reject" | "needs_revision";
    reviewer_note?: string;
  }) {
    const res = await fetch(`${API_URL}/hitl/review_decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to submit review decision");
    return res.json();
  },

  async getPendingReviews() {
    const res = await fetch(`${API_URL}/hitl/pending_reviews`);
    if (!res.ok) throw new Error("Failed to get pending reviews");
    return res.json() as Promise<
      Array<{
        violation_id: string;
        rule_id: string;
        severity: string;
        file_path: string;
        explanation: string;
      }>
    >;
  },

  // --- Job Status ---

  async getJobStatus(jobId: string) {
    const res = await fetch(`${API_URL}/jobs/${jobId}/status`);
    if (!res.ok) throw new Error("Failed to get job status");
    return res.json() as Promise<{
      job_id: string;
      status: "pending" | "running" | "completed" | "failed";
      progress: number;
      result: any;
      error: string | null;
    }>;
  },

  // --- GitHub Connection (separate from primary auth) ---

  async connectGitHub(code: string, redirectUri: string) {
    const res = await fetch(`${API_URL}/user/auth/github/callback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, redirect_uri: redirectUri }),
    });
    if (!res.ok) throw new Error("Failed to connect GitHub");
    return res.json() as Promise<{
      access_token: string;
      user: {
        login: string;
        avatar_url: string;
        name: string | null;
      };
    }>;
  },
};

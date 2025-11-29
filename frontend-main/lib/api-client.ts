/**
 * API Client for ReguPulse Backend
 */

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem("auth_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("auth_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("auth_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          error: data?.detail || data?.error || "Request failed",
          status: response.status,
        };
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, name: string) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password, name }),
    });
  }

  async getProfile() {
    return this.request("/auth/profile");
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request("/dashboard/stats");
  }

  async getRecentRuns(limit: number = 10) {
    return this.request(`/analysis/runs?limit=${limit}`);
  }

  async getRunDetails(runId: string) {
    return this.request(`/analysis/runs/${runId}`);
  }

  // Violations endpoints
  async getViolations(filters?: {
    status?: string;
    regulator?: string;
    runId?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.regulator) params.append("regulator", filters.regulator);
    if (filters?.runId) params.append("run_id", filters.runId);

    const queryString = params.toString();
    return this.request(`/violations${queryString ? `?${queryString}` : ""}`);
  }

  // Repositories endpoints
  async getRepositories(githubToken?: string) {
    return this.request("/user/repos", {
      headers: githubToken
        ? {
            Authorization: `Bearer ${githubToken}`,
          }
        : {},
    });
  }

  async indexRepositories(repoIds: number[], githubToken: string) {
    return this.request("/user/repos/index", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${githubToken}`,
      },
      body: JSON.stringify({
        repo_ids: repoIds,
        access_token: githubToken,
      }),
    });
  }

  async analyzeRepository(repoId: string) {
    return this.request(`/repos/${repoId}/analyze`, {
      method: "POST",
    });
  }

  // Regulations endpoints
  async getRegulations() {
    return this.request("/regulations");
  }

  async uploadRegulation(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    return fetch(`${this.baseURL}/regulations/upload`, {
      method: "POST",
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    }).then(async (res) => ({
      data: await res.json(),
      status: res.status,
    }));
  }

  // Jira endpoints
  async getJiraStatus() {
    return this.request("/api/jira/status");
  }

  async initiateJiraOAuth() {
    return this.request("/api/jira/connect");
  }

  async disconnectJira() {
    return this.request("/api/jira/disconnect", {
      method: "DELETE",
    });
  }

  async getJiraTickets(filters?: { status?: string }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);

    const queryString = params.toString();
    return this.request(`/jira/tickets${queryString ? `?${queryString}` : ""}`);
  }

  async createJiraTicket(data: {
    summary: string;
    description: string;
    violationId?: string;
  }) {
    return this.request("/jira/tickets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Settings endpoints
  async getSettings() {
    return this.request("/settings");
  }

  async updateSettings(settings: Record<string, any>) {
    return this.request("/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  }

  // Job status endpoints
  async getJobStatus(jobId: string) {
    return this.request(`/jobs/${jobId}`);
  }

  async getActiveJobs() {
    return this.request("/jobs/active");
  }

  // Health check
  async healthCheck() {
    return this.request("/health");
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;

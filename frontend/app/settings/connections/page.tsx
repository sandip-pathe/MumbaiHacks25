"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useRequireAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Github, Link as LinkIcon, CheckCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api-client";

export default function ConnectionsPage() {
  const auth = useRequireAuth();
  const { hasGitHub, hasJira, userEmail, setJiraConnection } = auth;
  const searchParams = useSearchParams();

  const [githubLoading, setGithubLoading] = useState(false);
  const [jiraLoading, setJiraLoading] = useState(false);
  const [jiraStatus, setJiraStatus] = useState<{
    connected: boolean;
    site_url?: string;
    site_name?: string;
    expires_at?: string;
  } | null>(null);

  // Derive success message from URL param (no effect needed)
  const success = searchParams.get("success");
  const successMessage = useMemo(() => {
    if (success === "github") return "GitHub connected successfully!";
    if (success === "jira") return "Jira connected successfully!";
    return "";
  }, [success]);

  useEffect(() => {
    // Fetch Jira status
    if (userEmail && hasJira) {
      apiClient
        .getJiraStatus(userEmail)
        .then((data) => {
          if (data.connected) {
            setJiraStatus(data);
          }
        })
        .catch(console.error);
    }
  }, [userEmail, hasJira]);

  const handleConnectGitHub = async () => {
    setGithubLoading(true);
    try {
      const redirectUri = `${window.location.origin}/auth/github/callback`;
      const result = await apiClient.getGitHubAuthUrl(
        redirectUri,
        "github_connection"
      );
      window.location.href = result.authorization_url;
    } catch (error) {
      console.error("Failed to initiate GitHub connection:", error);
      setGithubLoading(false);
    }
  };

  const handleConnectJira = async () => {
    if (!userEmail) return;

    setJiraLoading(true);
    try {
      const result = await apiClient.getJiraAuthUrl(userEmail);
      window.location.href = result.authorization_url;
    } catch (error) {
      console.error("Failed to initiate Jira connection:", error);
      setJiraLoading(false);
    }
  };

  const handleDisconnectJira = async () => {
    if (!userEmail) return;

    if (confirm("Are you sure you want to disconnect Jira?")) {
      try {
        await apiClient.disconnectJira(userEmail);
        setJiraConnection(false);
        setJiraStatus(null);
      } catch (error) {
        console.error("Failed to disconnect Jira:", error);
      }
    }
  };

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Integrations</h1>
        <p className="text-gray-400 mt-2">
          Connect your GitHub and Jira accounts to enable compliance scanning
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-950/30 border border-green-900/30 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* GitHub Integration */}
        <div className="bg-[#111] border border-[#333] rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-[#24292e] rounded-lg flex items-center justify-center">
                <Github className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">GitHub</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Connect your GitHub account to scan repositories
                </p>
                {hasGitHub && (
                  <div className="mt-3 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-400">Connected</span>
                  </div>
                )}
              </div>
            </div>

            {hasGitHub ? (
              <Button
                variant="outline"
                className="border-red-900/30 text-red-400 hover:bg-red-950/30"
                onClick={() => {
                  if (
                    confirm(
                      "Disconnect GitHub? You'll need to reconnect to scan repositories."
                    )
                  ) {
                    localStorage.removeItem("github_access_token");
                    window.location.reload();
                  }
                }}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={handleConnectGitHub}
                disabled={githubLoading}
                className="bg-[#24292e] text-white hover:bg-[#2f363d]"
              >
                {githubLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="mr-2 h-4 w-4" />
                    Connect GitHub
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Jira Integration */}
        <div className="bg-[#111] border border-[#333] rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 bg-blue-900/20 rounded-lg flex items-center justify-center">
                <LinkIcon className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Jira</h3>
                <p className="text-sm text-gray-400 mt-1">
                  Connect Jira to create tickets for compliance violations
                </p>
                {hasJira && jiraStatus && (
                  <div className="mt-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-400">Connected</span>
                    </div>
                    {jiraStatus.site_name && (
                      <p className="text-xs text-gray-500">
                        Site: {jiraStatus.site_name}
                      </p>
                    )}
                    {jiraStatus.site_url && (
                      <p className="text-xs text-gray-500">
                        URL: {jiraStatus.site_url}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {hasJira ? (
              <Button
                variant="outline"
                className="border-red-900/30 text-red-400 hover:bg-red-950/30"
                onClick={handleDisconnectJira}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={handleConnectJira}
                disabled={jiraLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {jiraLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Connect Jira
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Requirements Info */}
      <div className="mt-8 p-4 bg-blue-950/20 border border-blue-900/30 rounded-lg">
        <p className="text-sm text-blue-400">
          <strong>Note:</strong> Both GitHub and Jira connections are required
          to run compliance scans. You can explore the app without them, but
          scanning functionality will be disabled.
        </p>
      </div>
    </div>
  );
}

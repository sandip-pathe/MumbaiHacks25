"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, Link as LinkIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";

export function JiraIntegration() {
  const { hasJira, userEmail, setJiraConnection } = useAuth();
  const [loading, setLoading] = useState(false);
  const [jiraStatus, setJiraStatus] = useState<any>(null);

  useEffect(() => {
    if (hasJira && userEmail) {
      apiClient
        .getJiraStatus(userEmail)
        .then((data) => {
          if (data.connected) {
            setJiraStatus(data);
          }
        })
        .catch(console.error);
    }
  }, [hasJira, userEmail]);

  const handleConnect = async () => {
    if (!userEmail) return;

    setLoading(true);
    try {
      const result = await apiClient.getJiraAuthUrl(userEmail);
      window.location.href = result.authorization_url;
    } catch (error) {
      console.error("Failed to initiate Jira connection:", error);
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
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

  if (hasJira && jiraStatus) {
    return (
      <div className="bg-[#111] border border-green-900/30 rounded-xl p-6 flex items-center justify-between animate-in fade-in">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-green-900/20 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <div>
            <h3 className="text-white font-semibold">Jira Connected</h3>
            <p className="text-sm text-gray-400">
              {jiraStatus.site_name ||
                jiraStatus.site_url ||
                "Connected to Jira"}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleDisconnect}
          className="border-red-900/30 text-red-400 hover:bg-red-950/30 hover:text-red-300"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-[#333] rounded-xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-blue-900/20 rounded-lg flex items-center justify-center">
          <LinkIcon className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h3 className="text-white font-semibold">Connect Jira</h3>
          <p className="text-sm text-gray-400">
            Automate ticket creation for compliance violations.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Connect your Jira workspace using OAuth 2.0 to:
        </p>
        <ul className="text-sm text-gray-500 space-y-2 ml-4">
          <li>• Automatically create tickets for violations</li>
          <li>• Track remediation progress in Jira</li>
          <li>• Sync ticket status back to Anaya</li>
        </ul>

        <div className="pt-2">
          <Button
            onClick={handleConnect}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Redirecting to Jira...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" />
                Connect with Jira
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-gray-600 text-center">
          You'll be redirected to Atlassian to authorize the app
        </p>
      </div>
    </div>
  );
}

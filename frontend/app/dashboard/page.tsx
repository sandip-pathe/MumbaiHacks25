"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus, ArrowRight, Github } from "lucide-react";
import { ComplianceScore } from "@/components/ComplianceScoreCard";
import { JiraIntegration } from "@/components/JiraComponent";
import { RecentActivity } from "@/components/RecentActivity";
import { ConnectionStatusBanner } from "@/components/ConnectionStatusBanner";
import { useRequireAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";

export default function DashboardPage() {
  const router = useRouter();
  const auth = useRequireAuth();
  const [repoCount, setRepoCount] = useState(0);
  const [violationCount, setViolationCount] = useState(0);

  useEffect(() => {
    // Check GitHub connection by attempting to fetch repos
    if (auth.hasGitHub && auth.primaryToken) {
      apiClient
        .listUserRepos(auth.primaryToken)
        .then((data) => setRepoCount(data.total || 0))
        .catch(() => setRepoCount(0));
    }

    // Fetch pending violations count
    if (auth.primaryToken) {
      apiClient
        .getPendingViolations(auth.primaryToken)
        .then((data) => setViolationCount(data.length || 0))
        .catch(() => setViolationCount(0));
    }
  }, [auth.hasGitHub, auth.primaryToken]);

  if (auth.isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-[#222] rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-[#222] rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Overview</h1>
          <p className="text-gray-400 mt-1">
            Welcome back, {auth.userEmail || "User"}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
            onClick={() => router.push("/repos/select")}
            disabled={!auth.hasGitHub}
          >
            <Github className="h-4 w-4 mr-2" />
            Add Repository
          </Button>
          <Button
            className="bg-white text-black hover:bg-gray-200"
            onClick={() => router.push("/repos/scan")}
            disabled={!auth.hasAllConnections}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Scan
          </Button>
        </div>
      </div>

      {/* Connection Status Banner */}
      <ConnectionStatusBanner />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ComplianceScore score={78} trend={-5} />

        <div className="bg-[#111] border border-[#333] rounded-xl p-6">
          <p className="text-sm text-gray-400 font-medium">Open Violations</p>
          <div className="mt-4 flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-white">{violationCount}</h3>
            {violationCount > 0 && (
              <span className="text-sm text-red-400 font-medium">
                pending review
              </span>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <div className="h-2 flex-1 bg-red-500 rounded-full" />
            <div className="h-2 w-1/3 bg-orange-500 rounded-full" />
            <div className="h-2 w-1/4 bg-yellow-500 rounded-full" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Critical, High, Medium severity levels
          </p>
        </div>

        <div className="bg-[#111] border border-[#333] rounded-xl p-6">
          <p className="text-sm text-gray-400 font-medium">
            Repositories Connected
          </p>
          <h3 className="text-3xl font-bold text-white mt-4">{repoCount}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {auth.hasGitHub
              ? "GitHub connected"
              : "Connect GitHub to see repos"}
          </p>
          <Button
            variant="link"
            className="text-blue-400 h-auto p-0 mt-4 text-xs"
            onClick={() =>
              router.push(
                auth.hasGitHub ? "/repos/select" : "/settings/connections"
              )
            }
          >
            {auth.hasGitHub ? "Manage repos" : "Connect GitHub"}{" "}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Jira Widget */}
          <JiraIntegration />

          {/* Activity Feed */}
          <RecentActivity activities={[]} />
        </div>

        {/* Right Column - Review Queue Mini */}
        <div className="bg-[#111] border border-[#333] rounded-xl p-6 h-fit">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold text-white">Review Queue</h3>
            {violationCount > 0 && (
              <span className="bg-yellow-900/20 text-yellow-500 text-xs px-2 py-1 rounded-full border border-yellow-900/30">
                {violationCount} Pending
              </span>
            )}
          </div>

          {violationCount === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-gray-500">No pending violations</p>
              <p className="text-xs text-gray-600 mt-1">
                Run a scan to detect compliance issues
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="p-3 bg-[#0a0a0a] border border-[#222] rounded-lg hover:border-gray-600 transition-colors cursor-pointer group"
                    onClick={() => router.push("/violations/review")}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-mono text-gray-500">
                        Violation #{i}
                      </span>
                      <span className="text-[10px] text-red-400 bg-red-950/30 px-1.5 py-0.5 rounded border border-red-900/30">
                        PENDING
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-2 group-hover:text-white">
                      Compliance violation detected - review required
                    </p>
                  </div>
                ))}
              </div>

              <Button
                className="w-full mt-6 bg-[#222] text-white hover:bg-[#333]"
                onClick={() => router.push("/violations/review")}
              >
                Start Review Session
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

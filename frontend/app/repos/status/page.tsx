"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { useRequireAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";

interface IndexedRepo {
  id: number;
  full_name: string;
  status: "pending" | "indexing" | "indexed" | "failed";
  chunks_count: number;
  last_indexed: string | null;
}

export default function ReposStatusPage() {
  const router = useRouter();
  const auth = useRequireAuth();
  const searchParams = useSearchParams();
  const [repos, setRepos] = useState<IndexedRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [allCompleted, setAllCompleted] = useState(false);

  // Poll for repo status
  useEffect(() => {
    if (!auth.hasGitHub || !auth.githubAccessToken) {
      setLoading(false);
      return;
    }

    const fetchRepoStatuses = async () => {
      try {
        const result = await apiClient.listUserRepos(auth.githubAccessToken!);
        const repoStatuses: IndexedRepo[] = await Promise.all(
          result.repos.map(async (repo) => {
            try {
              const status = await apiClient.getRepoStatus(
                repo.id,
                auth.githubAccessToken!
              );
              return {
                id: repo.id,
                full_name: repo.full_name,
                status: status.status,
                chunks_count: status.chunks_count,
                last_indexed: status.last_indexed,
              };
            } catch {
              return {
                id: repo.id,
                full_name: repo.full_name,
                status: "pending" as const,
                chunks_count: 0,
                last_indexed: null,
              };
            }
          })
        );

        setRepos(repoStatuses);

        // Check if all are completed
        const completed = repoStatuses.every((r) => r.status === "indexed");
        setAllCompleted(completed);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch repo statuses:", error);
        setLoading(false);
      }
    };

    fetchRepoStatuses();

    // Poll every 3 seconds
    const interval = setInterval(fetchRepoStatuses, 3000);
    return () => clearInterval(interval);
  }, [auth.hasGitHub, auth.githubAccessToken]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "indexed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "indexing":
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case "pending":
        return <Clock className="h-5 w-5 text-gray-400" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "indexed":
        return "Indexed";
      case "indexing":
        return "Indexing...";
      case "pending":
        return "Pending";
      case "failed":
        return "Failed";
      default:
        return "Unknown";
    }
  };

  if (auth.isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="border-b border-[#333]">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold text-white">
              Indexing Status
            </h1>
          </div>
          {allCompleted && (
            <Button
              onClick={() => router.push("/repos/scan")}
              className="bg-white text-black hover:bg-gray-200"
              disabled={!auth.hasAllConnections}
            >
              Start Compliance Scan
            </Button>
          )}
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-blue-400 mb-2">
            {allCompleted ? "Indexing Complete!" : "Indexing in Progress"}
          </h2>
          <p className="text-sm text-blue-300/70">
            {allCompleted
              ? "All repositories have been indexed. You can now run a compliance scan."
              : "Your repositories are being analyzed. This may take a few minutes depending on the size of your codebase."}
          </p>
        </div>

        <div className="space-y-4">
          {repos.length === 0 ? (
            <div className="bg-[#111] border border-[#333] rounded-xl p-8 text-center">
              <p className="text-gray-400">No repositories found</p>
              <Button
                onClick={() => router.push("/repos/select")}
                className="mt-4 bg-white text-black hover:bg-gray-200"
              >
                Select Repositories
              </Button>
            </div>
          ) : (
            repos.map((repo) => (
              <div
                key={repo.id}
                className="bg-[#111] border border-[#333] rounded-xl p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getStatusIcon(repo.status)}
                    <div>
                      <h3 className="font-semibold text-white">
                        {repo.full_name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {getStatusText(repo.status)}
                        {repo.chunks_count > 0 &&
                          ` • ${repo.chunks_count} chunks indexed`}
                      </p>
                    </div>
                  </div>
                  {repo.status === "indexed" && (
                    <div className="text-right">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  )}
                </div>
                {repo.status === "indexing" && (
                  <div className="mt-4">
                    <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 animate-pulse w-2/3"></div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
          >
            Back to Dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}

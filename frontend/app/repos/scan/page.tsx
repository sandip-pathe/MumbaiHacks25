"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { AgentTerminal } from "@/components/AgentTerminal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  Shield,
  ArrowLeft,
  Play,
} from "lucide-react";
import { AgentLog } from "@/lib/types";
import { useRequireAuth } from "@/lib/auth-context";
import { ConnectionStatusBanner } from "@/components/ConnectionStatusBanner";
import { apiClient } from "@/lib/api-client";

// Simple Progress Component if shadcn/ui one is missing
const SimpleProgress = ({ value }: { value: number }) => (
  <div className="h-1 w-full bg-[#222] rounded-full overflow-hidden">
    <div
      className="h-full bg-blue-600 transition-all duration-500"
      style={{ width: `${value}%` }}
    />
  </div>
);

export default function ScanRunPage() {
  const router = useRouter();
  const auth = useRequireAuth();
  const [repos, setRepos] = useState<any[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState("");
  const [scanning, setScanning] = useState(false);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<any>(null);
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [progress, setProgress] = useState(0);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Fetch indexed repos
  useEffect(() => {
    if (!auth.hasGitHub || !auth.githubAccessToken) return;

    const fetchRepos = async () => {
      try {
        const result = await apiClient.listUserRepos(auth.githubAccessToken!);
        const indexedRepos = await Promise.all(
          result.repos.map(async (repo) => {
            try {
              const status = await apiClient.getRepoStatus(
                repo.id,
                auth.githubAccessToken!
              );
              return status.status === "indexed"
                ? { ...repo, indexed: true }
                : null;
            } catch {
              return null;
            }
          })
        );
        setRepos(indexedRepos.filter(Boolean) as any[]);
      } catch (error) {
        console.error("Failed to fetch repos:", error);
      }
    };

    fetchRepos();
  }, [auth.hasGitHub, auth.githubAccessToken]);

  // Poll for audit status
  useEffect(() => {
    if (!caseId) return;

    const pollStatus = async () => {
      try {
        const status = await apiClient.getAuditStatus(caseId);
        setScanStatus(status);

        // Parse agent outputs into logs
        const newLogs: AgentLog[] = [];
        let stepNum = 1;

        if (status.agent_outputs?.rule_reader) {
          newLogs.push({
            agent: "RULE_READER",
            message: `Loaded regulation: ${
              status.agent_outputs.rule_reader.rule_id ||
              "RBI Data Localization"
            }`,
            timestamp: new Date().toISOString(),
            ts_epoch: Date.now(),
          });
        }

        if (status.agent_outputs?.code_scanner) {
          newLogs.push({
            agent: "CODE_SCANNER",
            message: `Scanned ${
              status.agent_outputs.code_scanner.chunks_scanned || 0
            } code chunks`,
            timestamp: new Date().toISOString(),
            ts_epoch: Date.now(),
          });
        }

        if (status.agent_outputs?.rule_matcher) {
          newLogs.push({
            agent: "RULE_MATCHER",
            message: `Found ${
              status.violations_found || 0
            } potential violations`,
            timestamp: new Date().toISOString(),
            ts_epoch: Date.now(),
          });
        }

        setLogs(newLogs);

        // Calculate progress
        if (status.current_step && status.workflow_steps) {
          setProgress(
            (status.current_step / status.workflow_steps.length) * 100
          );
        }

        if (status.status === "completed" || status.status === "failed") {
          setScanning(false);
          return true; // Stop polling
        }
      } catch (error) {
        console.error("Failed to fetch audit status:", error);
      }
      return false;
    };

    const interval = setInterval(async () => {
      const shouldStop = await pollStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, 3000);

    pollStatus(); // Initial call
    return () => clearInterval(interval);
  }, [caseId]);

  const handleStartScan = async () => {
    if (!selectedRepoId || !auth.userEmail) return;

    setScanning(true);
    setLogs([
      {
        agent: "SYSTEM",
        message: "Initializing compliance scan...",
        timestamp: new Date().toISOString(),
        ts_epoch: Date.now(),
      },
    ]);

    try {
      const result = await apiClient.runAudit(selectedRepoId, auth.userEmail);
      setCaseId(result.case_id);
      setLogs((prev) => [
        ...prev,
        {
          agent: "SYSTEM",
          message: `Audit started with case ID: ${result.case_id}`,
          timestamp: new Date().toISOString(),
          ts_epoch: Date.now(),
        },
      ]);
    } catch (error: any) {
      console.error("Failed to start audit:", error);
      setLogs((prev) => [
        ...prev,
        {
          agent: "SYSTEM",
          message: `❌ Failed to start scan: ${error.message}`,
          timestamp: new Date().toISOString(),
          ts_epoch: Date.now(),
        },
      ]);
      setScanning(false);
    }
  };

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
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
              Compliance Scan
            </h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8">
        <ConnectionStatusBanner />

        {/* Repository Selection */}
        {!scanning && !caseId && (
          <div className="max-w-2xl mx-auto bg-[#111] border border-[#333] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Select Repository to Scan
            </h2>

            {repos.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">
                  No indexed repositories found
                </p>
                <Button
                  onClick={() => router.push("/repos/select")}
                  className="bg-white text-black hover:bg-gray-200"
                >
                  Index Repositories
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-6">
                  {repos.map((repo) => (
                    <label
                      key={repo.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedRepoId === String(repo.id)
                          ? "bg-blue-950/20 border-blue-900/30"
                          : "bg-[#0a0a0a] border-[#222] hover:border-[#333]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="repo"
                        value={repo.id}
                        checked={selectedRepoId === String(repo.id)}
                        onChange={(e) => setSelectedRepoId(e.target.value)}
                        className="text-blue-600"
                      />
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {repo.full_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {repo.language} • Updated{" "}
                          {new Date(repo.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <Button
                  onClick={handleStartScan}
                  disabled={!selectedRepoId || !auth.hasAllConnections}
                  className="w-full bg-white text-black hover:bg-gray-200"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Compliance Scan
                </Button>

                {!auth.hasAllConnections && (
                  <p className="text-xs text-yellow-500 mt-2 text-center">
                    Both GitHub and Jira connections required
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Scan Progress */}
        {(scanning || caseId) && (
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-12 bg-[#111] border border-[#333] rounded-lg flex items-center justify-center">
                <Shield
                  className={`h-6 w-6 ${
                    scanning ? "text-blue-500 animate-pulse" : "text-gray-400"
                  }`}
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  Compliance Scan #{caseId ? caseId.substring(0, 6) : "N/A"}
                  {scanStatus?.status === "completed" ? (
                    <Badge className="bg-green-900/30 text-green-400 border-green-900/50">
                      Completed
                    </Badge>
                  ) : scanStatus?.status === "failed" ? (
                    <Badge className="bg-red-900/30 text-red-400 border-red-900/50">
                      Failed
                    </Badge>
                  ) : (
                    <Badge className="bg-blue-900/30 text-blue-400 border-blue-900/50 animate-pulse">
                      Running
                    </Badge>
                  )}
                </h2>
                <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                  <span>
                    Repository:{" "}
                    {
                      repos.find((r) => String(r.id) === selectedRepoId)
                        ?.full_name
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-3 gap-8">
              {/* Left: Agent Terminal */}
              <div className="col-span-2 flex flex-col gap-4">
                <div className="bg-[#111] border border-[#333] rounded-xl p-1">
                  {/* Progress Bar */}
                  <div className="px-4 pt-4 pb-2">
                    <div className="flex justify-between text-xs text-gray-500 mb-2 uppercase font-semibold">
                      <span>Overall Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <SimpleProgress value={progress} />
                  </div>
                </div>

                {/* Terminal */}
                <AgentTerminal logs={logs} className="min-h-[400px]" />
              </div>

              {/* Right: Live Stats */}
              <div className="space-y-4">
                <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">
                    Findings Detected
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-red-950/20 border border-red-900/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                        <span className="text-red-200">Critical</span>
                      </div>
                      <span className="text-2xl font-bold text-white">
                        {scanStatus?.violations_found || 0}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-[#050505] border border-[#222] rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-gray-600" />
                        <span className="text-gray-400">Checks Complete</span>
                      </div>
                      <span className="text-2xl font-bold text-gray-500">
                        {scanStatus?.current_step || 0}/
                        {scanStatus?.workflow_steps?.length || 4}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-4">
                    Active Agents
                  </h3>
                  <div className="space-y-3">
                    {["RULE_READER", "CODE_SCANNER", "RULE_MATCHER"].map(
                      (agent) => {
                        const isActive =
                          logs.length > 0 &&
                          logs[logs.length - 1].agent === agent &&
                          scanning;
                        return (
                          <div
                            key={agent}
                            className="flex items-center justify-between"
                          >
                            <span
                              className={`text-sm ${
                                isActive
                                  ? "text-white font-medium"
                                  : "text-gray-600"
                              }`}
                            >
                              {agent}
                            </span>
                            {isActive && (
                              <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Completed State */}
            {scanStatus?.status === "completed" && (
              <div className="mt-6 bg-green-950/20 border border-green-900/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                  <h3 className="text-lg font-semibold text-green-400">
                    Scan Completed Successfully
                  </h3>
                </div>
                <p className="text-sm text-green-300/70 mb-4">
                  Found {scanStatus.violations_found || 0} compliance violations
                  that need review.
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => router.push("/violations/review")}
                    className="bg-white text-black hover:bg-gray-200"
                  >
                    Review Violations
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCaseId(null);
                      setScanning(false);
                      setLogs([]);
                      setScanStatus(null);
                      setSelectedRepoId("");
                    }}
                    className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
                  >
                    Start New Scan
                  </Button>
                </div>
              </div>
            )}

            {/* Failed State */}
            {scanStatus?.status === "failed" && (
              <div className="mt-6 bg-red-950/20 border border-red-900/30 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  <h3 className="text-lg font-semibold text-red-400">
                    Scan Failed
                  </h3>
                </div>
                <p className="text-sm text-red-300/70 mb-4">
                  The scan encountered an error. Please try again or contact
                  support.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCaseId(null);
                    setScanning(false);
                    setLogs([]);
                    setScanStatus(null);
                    setSelectedRepoId("");
                  }}
                  className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  AlertTriangle,
  FileCode,
  MessageSquare,
  Wrench,
  CheckCircle,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { useRequireAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";
import { Violation } from "@/lib/types";

export default function ViolationReviewPage() {
  const router = useRouter();
  const auth = useRequireAuth();
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(
    null
  );
  const [explanation, setExplanation] = useState("");
  const [suggestedFix, setSuggestedFix] = useState("");
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showJiraForm, setShowJiraForm] = useState(false);
  const [jiraForm, setJiraForm] = useState({
    project_key: "",
    issue_type: "Bug",
    priority: "High",
    assignee: "",
  });

  useEffect(() => {
    if (auth.primaryToken) {
      fetchViolations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.primaryToken]);

  const fetchViolations = async () => {
    try {
      if (!auth.primaryToken) return;
      const data = await apiClient.getPendingViolations(auth.primaryToken);
      setViolations(data || []);
    } catch (error) {
      console.error("Failed to fetch violations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async (violation: Violation) => {
    setSelectedViolation(violation);
    setLoadingAction("explain");
    try {
      const result = await apiClient.explainViolation(violation.violation_id);
      setExplanation(result.explanation);
    } catch (error) {
      console.error("Failed to get explanation:", error);
      setExplanation("Failed to generate explanation. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSuggestFix = async (violation: Violation) => {
    setSelectedViolation(violation);
    setLoadingAction("fix");
    try {
      const result = await apiClient.suggestFix(violation.violation_id);
      setSuggestedFix(result.suggested_code);
    } catch (error) {
      console.error("Failed to get fix suggestion:", error);
      setSuggestedFix("Failed to generate fix suggestion. Please try again.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApprove = async (violationId: string) => {
    try {
      if (!auth.primaryToken) return;
      await apiClient.updateViolationStatus(
        violationId,
        "approved",
        "Approved by user",
        auth.primaryToken
      );
      setViolations((prev) =>
        prev.filter((v) => v.violation_id !== violationId)
      );
    } catch (error) {
      console.error("Failed to approve violation:", error);
    }
  };

  const handleReject = async (violationId: string) => {
    try {
      if (!auth.primaryToken) return;
      await apiClient.updateViolationStatus(
        violationId,
        "rejected",
        "Rejected by user",
        auth.primaryToken
      );
      setViolations((prev) =>
        prev.filter((v) => v.violation_id !== violationId)
      );
    } catch (error) {
      console.error("Failed to reject violation:", error);
    }
  };

  const handleCreateJiraTicket = async () => {
    if (!selectedViolation || !auth.hasJira || !auth.userEmail) return;

    setLoadingAction("jira");
    try {
      const result = await apiClient.createJiraTicketFromViolation({
        user_id: auth.userEmail,
        violation_id: selectedViolation.violation_id,
        project_key: jiraForm.project_key,
        issue_type: jiraForm.issue_type,
        priority: jiraForm.priority,
        assignee: jiraForm.assignee || undefined,
      });

      // Show success and open ticket
      alert(`Jira ticket created successfully! Key: ${result.jira_ticket_key}`);
      if (result.jira_ticket_url) {
        window.open(result.jira_ticket_url, "_blank");
      }

      setShowJiraForm(false);
      setJiraForm({
        project_key: "",
        issue_type: "Bug",
        priority: "High",
        assignee: "",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to create Jira ticket:", error);
      alert(`Failed to create Jira ticket: ${message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-900/30 text-red-400 border-red-900/50";
      case "high":
        return "bg-orange-900/30 text-orange-400 border-orange-900/50";
      case "medium":
        return "bg-yellow-900/30 text-yellow-400 border-yellow-900/50";
      case "low":
        return "bg-blue-900/30 text-blue-400 border-blue-900/50";
      default:
        return "bg-gray-900/30 text-gray-400 border-gray-900/50";
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
              Review Violations
            </h1>
          </div>
          <div className="text-sm text-gray-400">
            {violations.length} pending violations
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {violations.length === 0 ? (
          <div className="text-center py-16">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              All Clear!
            </h2>
            <p className="text-gray-400 mb-6">
              No pending violations to review
            </p>
            <Button
              onClick={() => router.push("/repos/scan")}
              className="bg-white text-black hover:bg-gray-200"
            >
              Run New Scan
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Violation List */}
            <div className="space-y-4">
              {violations.map((violation) => (
                <div
                  key={violation.violation_id}
                  className="bg-[#111] border border-[#333] rounded-xl p-6 hover:border-[#444] transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <h3 className="text-white font-semibold">
                          {violation.rule_id}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {violation.explanation}
                        </p>
                      </div>
                    </div>
                    <Badge className={getSeverityColor(violation.severity)}>
                      {violation.severity}
                    </Badge>
                  </div>

                  {/* File Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
                    <FileCode className="h-4 w-4" />
                    <span className="font-mono">
                      {violation.file_path}:{violation.start_line}
                    </span>
                  </div>

                  {/* Code Evidence */}
                  {violation.evidence && (
                    <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 mb-4">
                      <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap">
                        {violation.evidence}
                      </pre>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExplain(violation)}
                      disabled={loadingAction === "explain"}
                      className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
                    >
                      {loadingAction === "explain" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <MessageSquare className="h-4 w-4 mr-2" />
                      )}
                      Explain
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSuggestFix(violation)}
                      disabled={loadingAction === "fix"}
                      className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
                    >
                      {loadingAction === "fix" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Wrench className="h-4 w-4 mr-2" />
                      )}
                      Suggest Fix
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApprove(violation.violation_id)}
                      className="border-green-900/30 text-green-400 hover:bg-green-950/20"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleReject(violation.violation_id)}
                      className="border-red-900/30 text-red-400 hover:bg-red-950/20"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>

                  {/* Jira Button */}
                  {auth.hasJira && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedViolation(violation);
                        setShowJiraForm(true);
                      }}
                      className="w-full mt-2 border-blue-900/30 text-blue-400 hover:bg-blue-950/20"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Create Jira Ticket
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Details Panel */}
            <div className="lg:sticky lg:top-8 h-fit">
              {!selectedViolation ? (
                <div className="bg-[#111] border border-[#333] rounded-xl p-8 text-center">
                  <p className="text-gray-400">
                    Select a violation to see HITL assistance
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Explanation */}
                  {explanation && (
                    <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-blue-400" />
                        Explanation
                      </h3>
                      <p className="text-gray-300 text-sm leading-relaxed">
                        {explanation}
                      </p>
                    </div>
                  )}

                  {/* Suggested Fix */}
                  {suggestedFix && (
                    <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                      <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-green-400" />
                        Suggested Fix
                      </h3>
                      <pre className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4 text-sm font-mono text-gray-300 whitespace-pre-wrap">
                        {suggestedFix}
                      </pre>
                    </div>
                  )}

                  {/* Jira Form */}
                  {showJiraForm && (
                    <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                      <h3 className="text-white font-semibold mb-4">
                        Create Jira Ticket
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm text-gray-400 block mb-1">
                            Project Key *
                          </label>
                          <input
                            type="text"
                            value={jiraForm.project_key}
                            onChange={(e) =>
                              setJiraForm({
                                ...jiraForm,
                                project_key: e.target.value,
                              })
                            }
                            placeholder="PROJ"
                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 block mb-1">
                            Issue Type
                          </label>
                          <select
                            value={jiraForm.issue_type}
                            onChange={(e) =>
                              setJiraForm({
                                ...jiraForm,
                                issue_type: e.target.value,
                              })
                            }
                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-600"
                          >
                            <option>Bug</option>
                            <option>Task</option>
                            <option>Story</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 block mb-1">
                            Priority
                          </label>
                          <select
                            value={jiraForm.priority}
                            onChange={(e) =>
                              setJiraForm({
                                ...jiraForm,
                                priority: e.target.value,
                              })
                            }
                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-600"
                          >
                            <option>Highest</option>
                            <option>High</option>
                            <option>Medium</option>
                            <option>Low</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-sm text-gray-400 block mb-1">
                            Assignee (optional)
                          </label>
                          <input
                            type="text"
                            value={jiraForm.assignee}
                            onChange={(e) =>
                              setJiraForm({
                                ...jiraForm,
                                assignee: e.target.value,
                              })
                            }
                            placeholder="email@example.com"
                            className="w-full bg-[#0a0a0a] border border-[#222] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-600"
                          />
                        </div>
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={handleCreateJiraTicket}
                            disabled={
                              !jiraForm.project_key || loadingAction === "jira"
                            }
                            className="flex-1 bg-white text-black hover:bg-gray-200"
                          >
                            {loadingAction === "jira" ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <ExternalLink className="h-4 w-4 mr-2" />
                            )}
                            Create Ticket
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setShowJiraForm(false)}
                            className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { useRequireAuth } from "@/lib/auth-context";
// import { apiClient } from "@/lib/api-client"; // Not used yet

interface AuditReport {
  case_id: string;
  repository_name: string;
  created_at: string;
  status: string;
  violations_found: number;
  total_checks: number;
  compliance_score: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const auth = useRequireAuth();
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // This endpoint doesn't exist yet in the backend, simulating for now
      // In real implementation: const data = await apiClient.getAuditReports();
      setReports([
        {
          case_id: "case_123abc",
          repository_name: "company/backend-api",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          status: "completed",
          violations_found: 3,
          total_checks: 15,
          compliance_score: 80,
        },
        {
          case_id: "case_456def",
          repository_name: "company/frontend-app",
          created_at: new Date(Date.now() - 172800000).toISOString(),
          status: "completed",
          violations_found: 0,
          total_checks: 12,
          compliance_score: 100,
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (caseId: string) => {
    try {
      // In real implementation:
      // const blob = await apiClient.downloadAuditReport(caseId);
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `compliance-report-${caseId}.pdf`;
      // a.click();

      alert(
        `Download report for case: ${caseId}\n(Report generation not implemented in backend yet)`
      );
    } catch (error) {
      console.error("Failed to download report:", error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    return "text-red-400";
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
              Compliance Reports
            </h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        {reports.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No Reports Yet
            </h2>
            <p className="text-gray-400 mb-6">
              Run a compliance scan to generate your first report
            </p>
            <Button
              onClick={() => router.push("/repos/scan")}
              className="bg-white text-black hover:bg-gray-200"
            >
              Run Scan
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.case_id}
                className="bg-[#111] border border-[#333] rounded-xl p-6 hover:border-[#444] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-lg">
                        {report.repository_name}
                      </h3>
                      <Badge className="bg-green-900/30 text-green-400 border-green-900/50">
                        {report.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span>•</span>
                      <span>Case ID: {report.case_id.substring(0, 8)}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReport(report.case_id)}
                    className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-6 mt-6">
                  <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Violations</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {report.violations_found}
                    </div>
                  </div>

                  <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Total Checks</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {report.total_checks}
                    </div>
                  </div>

                  <div className="bg-[#0a0a0a] border border-[#222] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                      <FileText className="h-4 w-4" />
                      <span>Score</span>
                    </div>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(
                        report.compliance_score
                      )}`}
                    >
                      {report.compliance_score}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

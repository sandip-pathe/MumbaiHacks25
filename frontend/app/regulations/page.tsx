"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  ArrowLeft,
  Shield,
  FileText,
  ExternalLink,
} from "lucide-react";
import { useRequireAuth } from "@/lib/auth-context";
import { apiClient } from "@/lib/api-client";

interface Regulation {
  id: string;
  title: string;
  description: string;
  source: string;
  total_chunks: number;
  created_at: string;
  status: string;
}

export default function RegulationsPage() {
  const router = useRouter();
  const auth = useRequireAuth();
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegulations();
  }, []);

  const fetchRegulations = async () => {
    try {
      // Using demo regulation metadata endpoint
      const data = await apiClient.getDemoRegulationMetadata();
      setRegulations([
        {
          id: data.data.rule_id,
          title: data.data.title,
          description: `${data.data.category} - ${data.data.regulatory_body} regulation`,
          source: data.data.regulatory_body,
          total_chunks: data.data.chunk_count,
          created_at: new Date().toISOString(),
          status: "active",
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch regulations:", error);
      // Fallback to hardcoded for hackathon demo
      setRegulations([
        {
          id: "RBI-DATA-LOC",
          title: "RBI Data Localization Requirements",
          description:
            "Reserve Bank of India guidelines requiring payment system operators to store transaction data within India",
          source: "RBI/2017-18/153",
          total_chunks: 45,
          created_at: new Date().toISOString(),
          status: "active",
        },
      ]);
    } finally {
      setLoading(false);
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
              Compliance Regulations
            </h1>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="bg-blue-950/20 border border-blue-900/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-300">
            <strong>Hackathon Mode:</strong> Regulations are pre-loaded for demo
            purposes. In production, you would manage and upload custom
            regulation documents here.
          </p>
        </div>

        {regulations.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No Regulations Loaded
            </h2>
            <p className="text-gray-400">
              No compliance regulations are currently configured
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {regulations.map((regulation) => (
              <div
                key={regulation.id}
                className="bg-[#111] border border-[#333] rounded-xl p-6 hover:border-[#444] transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-5 w-5 text-green-400" />
                      <h3 className="text-white font-semibold text-lg">
                        {regulation.title}
                      </h3>
                      <Badge className="bg-green-900/30 text-green-400 border-green-900/50">
                        {regulation.status}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                      {regulation.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{regulation.total_chunks} chunks indexed</span>
                      </div>
                      <span>•</span>
                      <span>Source: {regulation.source}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      window.open("https://www.rbi.org.in", "_blank")
                    }
                    className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Source
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled
                    className="border-[#333] text-gray-500"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-[#111] border border-[#333] rounded-xl p-6">
          <h3 className="text-white font-semibold mb-2">About Regulations</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            This compliance engine uses vector embeddings to match your code
            against regulatory requirements. For this hackathon demo, we&apos;ve
            pre-loaded RBI data localization requirements. In production, admins
            can upload any regulatory framework in PDF/markdown format, which
            gets automatically chunked and embedded for semantic search during
            code scans.
          </p>
        </div>
      </main>
    </div>
  );
}

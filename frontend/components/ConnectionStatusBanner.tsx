"use client";

import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Github,
  Link as LinkIcon,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function ConnectionStatusBanner() {
  const { hasGitHub, hasJira, hasAllConnections } = useAuth();
  const router = useRouter();

  if (hasAllConnections) {
    return (
      <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-400">
              All integrations connected
            </p>
            <p className="text-xs text-green-500/70">
              GitHub and Jira are ready for compliance scanning
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-950/20 border border-yellow-900/30 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-400 mb-2">
            Complete your setup to start scanning
          </p>

          <div className="space-y-2">
            {!hasGitHub && (
              <div className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Connect GitHub</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
                  onClick={() => router.push("/settings/connections")}
                >
                  Connect
                </Button>
              </div>
            )}

            {!hasJira && (
              <div className="flex items-center justify-between bg-[#0a0a0a] p-3 rounded-md">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Connect Jira</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#333] text-gray-300 hover:bg-[#1a1a1a]"
                  onClick={() => router.push("/settings/connections")}
                >
                  Connect
                </Button>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-3">
            You can browse the app, but scanning requires both integrations
          </p>
        </div>
      </div>
    </div>
  );
}

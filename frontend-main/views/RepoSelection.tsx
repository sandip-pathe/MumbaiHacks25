import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/Button";
import { GlassCard } from "../components/ui/GlassCard";
import {
  Github,
  CheckCircle,
  AlertCircle,
  X,
  Loader2,
  Search,
  Star,
  GitBranch,
  Lock,
  Unlock,
} from "lucide-react";
import { apiClient } from "../lib/api-client";

interface RepoSelectionProps {
  githubToken: string;
  onComplete: () => void;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  html_url: string;
  default_branch: string;
  language: string | null;
  updated_at: string;
  owner: {
    login: string;
    avatar_url: string;
  };
}

interface ToastProps {
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: "bg-success/10 border-success/20 text-success",
    error: "bg-danger/10 border-danger/20 text-danger",
    info: "bg-accent1/10 border-accent1/20 text-accent1",
  };

  return (
    <div
      className={`fixed top-6 right-6 z-50 animate-fade-in-up flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${styles[type]}`}
    >
      {type === "success" && <CheckCircle size={18} />}
      {type === "error" && <AlertCircle size={18} />}
      {type === "info" && <AlertCircle size={18} />}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X size={14} />
      </button>
    </div>
  );
};

export const RepoSelection: React.FC<RepoSelectionProps> = ({
  githubToken,
  onComplete,
}) => {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [indexing, setIndexing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8000/user/repos", {
        headers: {
          Authorization: `Bearer ${githubToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }

      const data = await response.json();
      setRepos(data.repos || []);
      setToast({
        message: `Found ${data.total} repositories`,
        type: "success",
      });
    } catch (error) {
      console.error("Error fetching repos:", error);
      setToast({ message: "Failed to load repositories", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const toggleRepo = (repoId: number) => {
    const newSelected = new Set(selectedRepos);
    if (newSelected.has(repoId)) {
      newSelected.delete(repoId);
    } else {
      newSelected.add(repoId);
    }
    setSelectedRepos(newSelected);
  };

  const handleIndexRepos = async () => {
    if (selectedRepos.size === 0) {
      setToast({
        message: "Please select at least one repository",
        type: "error",
      });
      return;
    }

    setIndexing(true);
    try {
      const response = await fetch("http://localhost:8000/user/repos/index", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repo_ids: Array.from(selectedRepos),
          access_token: githubToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to index repositories");
      }

      const data = await response.json();
      setToast({
        message: `Successfully queued ${selectedRepos.size} repositories for indexing`,
        type: "success",
      });

      // Wait a bit to show the success message, then proceed
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (error) {
      console.error("Error indexing repos:", error);
      setToast({ message: "Failed to index repositories", type: "error" });
      setIndexing(false);
    }
  };

  const filteredRepos = repos.filter(
    (repo) =>
      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-bgMain p-6">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-accent1/10 rounded-full blur-[120px]" />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-6xl w-full relative z-10 space-y-8 animate-fade-in-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-secondary to-accent1 flex items-center justify-center shadow-lg">
              <Github size={24} className="text-bgMain" />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white">
            Select Repositories
          </h2>
          <p className="text-accent3">
            Choose the repositories you want to monitor for compliance
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-accent3"
            size={20}
          />
          <input
            type="text"
            placeholder="Search repositories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-accent3 focus:border-secondary/50 focus:bg-white/10 focus:outline-none transition-all"
          />
        </div>

        {/* Selection Stats */}
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
          <div className="text-sm text-accent3">
            {selectedRepos.size} of {filteredRepos.length} selected
          </div>
          {selectedRepos.size > 0 && (
            <button
              onClick={() => setSelectedRepos(new Set())}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Repositories List */}
        <GlassCard className="max-w-4xl mx-auto max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 size={48} className="animate-spin text-secondary" />
              <p className="text-accent3">Loading repositories...</p>
            </div>
          ) : filteredRepos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Github size={48} className="text-accent3" />
              <p className="text-accent3">No repositories found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredRepos.map((repo) => (
                <div
                  key={repo.id}
                  onClick={() => toggleRepo(repo.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    selectedRepos.has(repo.id)
                      ? "bg-secondary/10 border-secondary/30 shadow-[0_0_15px_rgba(255,179,71,0.1)]"
                      : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Checkbox */}
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-1 ${
                          selectedRepos.has(repo.id)
                            ? "bg-secondary border-secondary"
                            : "border-white/30 bg-transparent"
                        }`}
                      >
                        {selectedRepos.has(repo.id) && (
                          <CheckCircle size={14} className="text-bgMain" />
                        )}
                      </div>

                      {/* Repo Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-heading font-semibold text-white">
                            {repo.full_name}
                          </h3>
                          {repo.private ? (
                            <Lock size={14} className="text-accent3" />
                          ) : (
                            <Unlock size={14} className="text-accent3" />
                          )}
                        </div>

                        {repo.description && (
                          <p className="text-sm text-accent3 mb-2">
                            {repo.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-accent3">
                          {repo.language && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-accent1"></div>
                              {repo.language}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <GitBranch size={12} />
                            {repo.default_branch}
                          </div>
                          <div>
                            Updated{" "}
                            {new Date(repo.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => window.history.back()}
            disabled={indexing}
            className="w-32"
          >
            Back
          </Button>
          <Button
            onClick={handleIndexRepos}
            disabled={selectedRepos.size === 0 || indexing}
            className="w-48"
          >
            {indexing ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Indexing...
              </>
            ) : (
              `Index ${selectedRepos.size > 0 ? selectedRepos.size : ""} ${
                selectedRepos.size === 1 ? "Repository" : "Repositories"
              }`
            )}
          </Button>
        </div>

        {/* Info Message */}
        <div className="max-w-2xl mx-auto">
          <div className="p-4 rounded-xl bg-accent1/5 border border-accent1/20 text-center">
            <p className="text-sm text-accent1">
              Selected repositories will be analyzed for compliance. This may
              take a few minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

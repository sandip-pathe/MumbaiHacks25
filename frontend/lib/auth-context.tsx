"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface AuthState {
  // Primary authentication
  primaryToken: string | null;
  userEmail: string | null;

  // Secondary integrations
  githubAccessToken: string | null;
  jiraConnected: boolean;

  // Loading state
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  // Auth actions
  setPrimaryAuth: (token: string, email: string) => void;
  setGitHubConnection: (token: string) => void;
  setJiraConnection: (connected: boolean) => void;
  logout: () => void;

  // Helper checks
  isAuthenticated: boolean;
  hasGitHub: boolean;
  hasJira: boolean;
  hasAllConnections: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // Initialize state from localStorage
  const [state, setState] = useState<AuthState>(() => {
    if (typeof window === "undefined") {
      return {
        primaryToken: null,
        userEmail: null,
        githubAccessToken: null,
        jiraConnected: false,
        isLoading: true,
      };
    }

    return {
      primaryToken: localStorage.getItem("primary_token"),
      userEmail: localStorage.getItem("user_email"),
      githubAccessToken: localStorage.getItem("github_access_token"),
      jiraConnected: localStorage.getItem("jira_connected") === "true",
      isLoading: false,
    };
  });

  const setPrimaryAuth = (token: string, email: string) => {
    localStorage.setItem("primary_token", token);
    localStorage.setItem("user_email", email);
    setState((prev) => ({
      ...prev,
      primaryToken: token,
      userEmail: email,
    }));
  };

  const setGitHubConnection = (token: string) => {
    localStorage.setItem("github_access_token", token);
    setState((prev) => ({
      ...prev,
      githubAccessToken: token,
    }));
  };

  const setJiraConnection = (connected: boolean) => {
    localStorage.setItem("jira_connected", String(connected));
    setState((prev) => ({
      ...prev,
      jiraConnected: connected,
    }));
  };

  const logout = () => {
    localStorage.removeItem("primary_token");
    localStorage.removeItem("user_email");
    localStorage.removeItem("github_access_token");
    localStorage.removeItem("jira_connected");

    setState({
      primaryToken: null,
      userEmail: null,
      githubAccessToken: null,
      jiraConnected: false,
      isLoading: false,
    });

    router.push("/auth/signin");
  };

  const value: AuthContextType = {
    ...state,
    setPrimaryAuth,
    setGitHubConnection,
    setJiraConnection,
    logout,
    isAuthenticated: !!state.primaryToken,
    hasGitHub: !!state.githubAccessToken,
    hasJira: state.jiraConnected,
    hasAllConnections: !!state.githubAccessToken && state.jiraConnected,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Auth guard hook for protected routes
export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      router.push("/auth/signin");
    }
  }, [auth.isLoading, auth.isAuthenticated, router]);

  return auth;
}

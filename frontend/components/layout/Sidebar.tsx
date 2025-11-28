"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ShieldAlert,
  FileText,
  Settings,
  GitBranch,
  ScanLine,
  Link as LinkIcon,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Repositories", href: "/repos/select", icon: GitBranch },
  { name: "Scan Compliance", href: "/repos/scan", icon: ScanLine },
  { name: "Review Violations", href: "/violations/review", icon: ShieldAlert },
  { name: "Reports", href: "/reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userEmail, logout } = useAuth();

  return (
    <div className="flex flex-col w-64 bg-[#050505] border-r border-[#222] h-screen fixed left-0 top-0">
      <div className="p-6 border-b border-[#222]">
        <div className="flex items-center gap-2 font-bold text-white text-xl">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white">A</span>
          </div>
          Anaya
        </div>
        <div className="text-xs text-gray-500 mt-1">Compliance Engine</div>
        {userEmail && (
          <div className="text-xs text-gray-600 mt-2 truncate">{userEmail}</div>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname?.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-blue-900/20 text-blue-400 border border-blue-900/30"
                  : "text-gray-400 hover:text-white hover:bg-[#111]"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#222] space-y-1">
        <Link
          href="/settings/connections"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-md hover:bg-[#111]"
        >
          <LinkIcon className="h-4 w-4" />
          Connections
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-md hover:bg-[#111]"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 hover:text-red-400 rounded-md hover:bg-[#111] w-full text-left"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

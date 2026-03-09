"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  FileText,
  Shield,
  FolderOpen,
  Users,
  GraduationCap,
  AlertTriangle,
  Store,
  ClipboardCheck,
  Calendar,
  ChevronDown,
  Server,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const [companyOpen, setCompanyOpen] = useState(true);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-72 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#0066FF] rounded-lg flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-semibold text-lg text-gray-900">TrustSpace</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mb-1",
            isActive("/dashboard")
              ? "text-[#0066FF] bg-blue-50"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <LayoutDashboard className={cn("w-5 h-5", isActive("/dashboard") ? "text-[#0066FF]" : "text-gray-500")} />
          <span>Dashboard</span>
        </Link>

        {/* Unternehmen (aufklappbar) */}
        <div className="mb-1">
          <button
            onClick={() => setCompanyOpen(!companyOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
              (isActive("/policies") || isActive("/soa") || isActive("/documents"))
                ? "text-[#0066FF] bg-blue-50"
                : "text-gray-600 hover:bg-gray-50"
            )}
          >
            <Building2 className={cn("w-5 h-5", (isActive("/policies") || isActive("/soa") || isActive("/documents")) ? "text-[#0066FF]" : "text-gray-500")} />
            <span className="flex-1 text-left">Unternehmen</span>
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", companyOpen && "rotate-180")} />
          </button>
          
          {companyOpen && (
            <div className="ml-9 mt-1 space-y-1">
              <Link
                href="/policies"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                  isActive("/policies")
                    ? "text-[#0066FF] bg-blue-50 font-medium"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <FileText className="w-4 h-4" />
                <span>Richtlinien</span>
              </Link>
              <Link
                href="/soa"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                  isActive("/soa")
                    ? "text-[#0066FF] bg-blue-50 font-medium"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <Shield className="w-4 h-4" />
                <span>SOA</span>
              </Link>
              <Link
                href="/documents"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                  isActive("/documents")
                    ? "text-[#0066FF] bg-blue-50 font-medium"
                    : "text-gray-500 hover:bg-gray-50"
                )}
              >
                <FolderOpen className="w-4 h-4" />
                <span>Dokumente</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mitarbeiter - EIGENSTÄNDIG */}
        <Link
          href="/employees"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mb-1",
            isActive("/employees")
              ? "text-[#0066FF] bg-blue-50"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <Users className={cn("w-5 h-5", isActive("/employees") ? "text-[#0066FF]" : "text-gray-500")} />
          <span>Mitarbeiter</span>
        </Link>

        {/* Training - EIGENSTÄNDIG */}
        <Link
          href="/training"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mb-1",
            isActive("/training")
              ? "text-[#0066FF] bg-blue-50"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <GraduationCap className={cn("w-5 h-5", isActive("/training") ? "text-[#0066FF]" : "text-gray-500")} />
          <span>Training</span>
        </Link>

        {/* Risks & Assets */}
        <Link
          href="/risks"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mb-1",
            isActive("/risks")
              ? "text-[#0066FF] bg-blue-50"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <AlertTriangle className={cn("w-5 h-5", isActive("/risks") ? "text-[#0066FF]" : "text-gray-500")} />
          <span>Risks & Assets</span>
        </Link>

        {/* Assetmanagement v2 */}
        <Link
          href="/asset-management-v2"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mb-1",
            isActive("/asset-management-v2")
              ? "text-[#0066FF] bg-blue-50"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <Server className={cn("w-5 h-5", isActive("/asset-management-v2") ? "text-[#0066FF]" : "text-gray-500")} />
          <span>Assetmanagement v2</span>
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-[#0066FF]">NEU</span>
        </Link>

        {/* Risikomanagement v2 */}
        <Link
          href="/risk-management-v2"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mb-1",
            isActive("/risk-management-v2")
              ? "text-[#0066FF] bg-blue-50"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <BarChart3 className={cn("w-5 h-5", isActive("/risk-management-v2") ? "text-[#0066FF]" : "text-gray-500")} />
          <span>Risikomanagement v2</span>
          <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-[#0066FF]">NEU</span>
        </Link>

        {/* Vendoren */}
        <Link
          href="/vendors"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mb-1",
            isActive("/vendors")
              ? "text-[#0066FF] bg-blue-50"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <Store className={cn("w-5 h-5", isActive("/vendors") ? "text-[#0066FF]" : "text-gray-500")} />
          <span>Vendoren</span>
        </Link>

        {/* Maßnahmen */}
        <Link
          href="/findings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mb-1",
            isActive("/findings")
              ? "text-[#0066FF] bg-blue-50"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <ClipboardCheck className={cn("w-5 h-5", isActive("/findings") ? "text-[#0066FF]" : "text-gray-500")} />
          <span>Maßnahmen</span>
        </Link>

        {/* Audits */}
        <Link
          href="/audits"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors mb-1",
            isActive("/audits")
              ? "text-[#0066FF] bg-blue-50"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <Calendar className={cn("w-5 h-5", isActive("/audits") ? "text-[#0066FF]" : "text-gray-500")} />
          <span>Audits</span>
        </Link>
      </nav>

      {/* Bottom */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-2 px-3">
          <span className="text-xs text-gray-400">German</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </aside>
  );
}

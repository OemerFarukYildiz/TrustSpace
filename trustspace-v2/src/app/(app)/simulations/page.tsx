"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Plus,
  Loader2,
  Users,
  Clock,
  CheckCircle2,
  Play,
  Shield,
  Flame,
  Database,
  Server,
  ChevronRight,
  BarChart3,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Session {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  createdAt: string;
  scenario: {
    title: string;
    category: string;
    difficulty: string;
    estimatedMinutes: number;
  };
  _count: { participants: number };
  participants: {
    status: string;
    score: number;
    maxScore: number;
  }[];
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cyber: Shield,
  physical: Flame,
  data: Database,
  operational: Server,
};

const CATEGORY_COLORS: Record<string, string> = {
  cyber: "bg-red-100 text-red-700 border-red-200",
  physical: "bg-orange-100 text-orange-700 border-orange-200",
  data: "bg-purple-100 text-purple-700 border-purple-200",
  operational: "bg-blue-100 text-blue-700 border-blue-200",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: "bg-emerald-50 text-emerald-700",
  medium: "bg-amber-50 text-amber-700",
  hard: "bg-red-50 text-red-700",
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  draft: { label: "Entwurf", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  active: { label: "Aktiv", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  closed: { label: "Abgeschlossen", cls: "bg-blue-100 text-blue-700 border-blue-200" },
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function SimulationsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/simulations/sessions")
      .then((r) => r.json())
      .then((data) => setSessions(Array.isArray(data) ? data : []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  // Stats
  const totalSessions = sessions.length;
  const activeSessions = sessions.filter((s) => s.status === "active").length;
  const totalParticipants = sessions.reduce((sum, s) => sum + (s._count?.participants ?? 0), 0);
  const completedParticipants = sessions.reduce(
    (sum, s) => sum + (s.participants?.filter((p) => p.status === "completed").length ?? 0),
    0
  );
  const avgScore = sessions.length > 0
    ? Math.round(
        sessions
          .flatMap((s) => s.participants?.filter((p) => p.status === "completed") ?? [])
          .reduce((sum, p) => sum + (p.maxScore > 0 ? (p.score / p.maxScore) * 100 : 0), 0) /
          Math.max(completedParticipants, 1)
      )
    : 0;

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-1.5 rounded-lg bg-orange-100">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Notfallsimulationen</h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
              PREMIUM
            </span>
          </div>
          <p className="text-sm text-gray-500 ml-10">
            Interaktive Notfallübungen für ISO 27001 (A.5.24) und BCM-Nachweis
          </p>
        </div>
        <Link href="/simulations/new">
          <Button className="bg-[#0066FF] hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Neue Simulation
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Simulationen", value: totalSessions, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Aktiv", value: activeSessions, icon: Play, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Teilnehmer", value: `${completedParticipants}/${totalParticipants}`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Ø Score", value: `${avgScore}%`, icon: Trophy, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sessions List */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-orange-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Noch keine Simulationen</h3>
          <p className="text-sm text-gray-500 mt-1 mb-6">
            Erstellen Sie Ihre erste Notfallübung um Mitarbeiter zu schulen und ISO 27001 Nachweise zu generieren.
          </p>
          <Link href="/simulations/new">
            <Button className="bg-[#0066FF] hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Erste Simulation erstellen
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => {
            const CatIcon = CATEGORY_ICONS[session.scenario.category] ?? AlertTriangle;
            const catColor = CATEGORY_COLORS[session.scenario.category] ?? "bg-gray-100 text-gray-600";
            const diffColor = DIFFICULTY_COLORS[session.scenario.difficulty] ?? "bg-gray-50 text-gray-600";
            const statusCfg = STATUS_CFG[session.status] ?? STATUS_CFG.draft;
            const participantCount = session._count?.participants ?? 0;
            const completedCount = session.participants?.filter((p) => p.status === "completed").length ?? 0;
            const completionPct = participantCount > 0 ? Math.round((completedCount / participantCount) * 100) : 0;

            return (
              <div
                key={session.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
                onClick={() => router.push(`/simulations/${session.id}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border", catColor)}>
                    <CatIcon className="w-6 h-6" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#0066FF] transition-colors truncate">
                        {session.title}
                      </h3>
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full border", statusCfg.cls)}>
                        {statusCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", catColor)}>
                        {session.scenario.title}
                      </span>
                      <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium", diffColor)}>
                        {session.scenario.difficulty === "easy" ? "Leicht" : session.scenario.difficulty === "hard" ? "Schwer" : "Mittel"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        ~{session.scenario.estimatedMinutes} Min
                      </span>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Users className="w-3.5 h-3.5" />
                        <span>{completedCount}/{participantCount}</span>
                      </div>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", completionPct === 100 ? "bg-emerald-500" : "bg-[#0066FF]")}
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                    </div>

                    {session.deadline && (
                      <div className="text-xs text-gray-400">
                        <span className="block">Deadline</span>
                        <span className="font-medium text-gray-600">{formatDate(session.deadline)}</span>
                      </div>
                    )}

                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#0066FF] transition-colors" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

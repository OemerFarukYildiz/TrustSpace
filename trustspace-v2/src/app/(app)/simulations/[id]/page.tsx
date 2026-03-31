"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Shield,
  Flame,
  Database,
  Server,
  ChevronLeft,
  ChevronDown,
  Users,
  Clock,
  Loader2,
  CheckCircle2,
  Play,
  Copy,
  ExternalLink,
  Trophy,
  Star,
  BarChart3,
  XCircle,
  Pause,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Participant {
  id: string;
  token: string;
  status: string;
  score: number;
  maxScore: number;
  timeTakenSec: number;
  startedAt: string | null;
  completedAt: string | null;
  choices: string | null;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
  };
}

interface SessionDetail {
  id: string;
  title: string;
  status: string;
  deadline: string | null;
  customFields: string | null;
  createdAt: string;
  scenario: {
    title: string;
    category: string;
    difficulty: string;
    estimatedMinutes: number;
    decisionTree: string;
  };
  participants: Participant[];
}

interface ParticipantChoice {
  sceneId: number;
  choiceId: string;
  freeText?: string;
  timeSpentSec: number;
}

interface SceneNode {
  id: number;
  title: string;
  freeTextPrompt?: string;
  choices: { id: string; score: number; isOptimal: boolean }[];
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  cyber: Shield, physical: Flame, data: Database, operational: Server,
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-emerald-100 text-emerald-700",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDuration(sec: number) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function SimulationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedParticipants, setExpandedParticipants] = useState<Set<string>>(new Set());

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/simulations/sessions/${sessionId}`);
      if (res.ok) setSession(await res.json());
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchSession(); }, [fetchSession]);

  async function updateStatus(status: string) {
    await fetch(`/api/simulations/sessions/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchSession();
  }

  async function handleDelete() {
    if (!confirm("Simulation wirklich löschen?")) return;
    await fetch(`/api/simulations/sessions/${sessionId}`, { method: "DELETE" });
    router.push("/simulations");
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/simulation/play/${sessionId}/${token}`;
    navigator.clipboard.writeText(url);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  function toggleParticipant(id: string) {
    setExpandedParticipants((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Simulation nicht gefunden</p>
      </div>
    );
  }

  const CatIcon = CATEGORY_ICONS[session.scenario.category] ?? AlertTriangle;
  const completed = session.participants.filter((p) => p.status === "completed");
  const pending = session.participants.filter((p) => p.status === "pending");
  const inProgress = session.participants.filter((p) => p.status === "in_progress");
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((sum, p) => sum + (p.maxScore > 0 ? (p.score / p.maxScore) * 100 : 0), 0) / completed.length)
    : 0;
  const avgTime = completed.length > 0
    ? Math.round(completed.reduce((sum, p) => sum + p.timeTakenSec, 0) / completed.length)
    : 0;

  return (
    <div className="p-8 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href="/simulations">
            <Button variant="ghost" size="sm" className="text-gray-500">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{session.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">{session.scenario.title}</Badge>
              <Badge variant="outline" className={cn("text-xs", session.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : session.status === "closed" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-gray-50 text-gray-600")}>
                {session.status === "active" ? "Aktiv" : session.status === "closed" ? "Abgeschlossen" : "Entwurf"}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session.status === "draft" && (
            <Button size="sm" onClick={() => updateStatus("active")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Play className="w-3.5 h-3.5 mr-1.5" />
              Aktivieren
            </Button>
          )}
          {session.status === "active" && (
            <Button size="sm" variant="outline" onClick={() => updateStatus("closed")}>
              <Pause className="w-3.5 h-3.5 mr-1.5" />
              Schließen
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={handleDelete} className="text-red-600 border-red-200 hover:bg-red-50">
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Löschen
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Teilnehmer", value: `${completed.length}/${session.participants.length}`, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Ø Score", value: `${avgScore}%`, icon: Trophy, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Ø Dauer", value: formatDuration(avgTime), icon: Clock, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Ausstehend", value: pending.length + inProgress.length, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5">{stat.value}</p>
              </div>
              <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center", stat.bg)}>
                <stat.icon className={cn("h-4.5 w-4.5", stat.color)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Participants Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            Teilnehmer
          </h2>
          {session.status === "active" && (
            <p className="text-xs text-gray-400">Links können an Mitarbeiter gesendet werden</p>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-xs text-gray-500">
              <th className="text-left py-3 px-6 font-semibold">Mitarbeiter</th>
              <th className="text-center py-3 px-4 font-semibold">Status</th>
              <th className="text-center py-3 px-4 font-semibold">Score</th>
              <th className="text-center py-3 px-4 font-semibold">Dauer</th>
              <th className="text-center py-3 px-4 font-semibold">Abgeschlossen</th>
              <th className="text-right py-3 px-6 font-semibold">Aktionen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {session.participants.map((p) => {
              const pct = p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0;
              const stars = pct >= 90 ? 5 : pct >= 75 ? 4 : pct >= 60 ? 3 : pct >= 40 ? 2 : 1;

              return (
                <tr key={p.id} className="hover:bg-gray-50/50">
                  <td className="py-3.5 px-6">
                    <p className="font-medium text-gray-900">{p.employee.firstName} {p.employee.lastName}</p>
                    <p className="text-xs text-gray-400">{p.employee.email}</p>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", STATUS_COLORS[p.status])}>
                      {p.status === "completed" && <CheckCircle2 className="w-3 h-3" />}
                      {p.status === "in_progress" && <Play className="w-3 h-3" />}
                      {p.status === "completed" ? "Abgeschlossen" : p.status === "in_progress" ? "In Bearbeitung" : "Ausstehend"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {p.status === "completed" ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className={cn("font-bold", pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600")}>
                          {pct}%
                        </span>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={cn("w-3 h-3", i < stars ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs text-gray-500 font-mono">
                    {p.status === "completed" ? formatDuration(p.timeTakenSec) : "—"}
                  </td>
                  <td className="py-3.5 px-4 text-center text-xs text-gray-500">
                    {formatDate(p.completedAt)}
                  </td>
                  <td className="py-3.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => copyLink(p.token)}
                      >
                        {copied === p.token ? (
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3 mr-1" />
                        )}
                        {copied === p.token ? "Kopiert!" : "Link"}
                      </Button>
                      {p.status !== "pending" && (
                        <a
                          href={`/simulation/play/${sessionId}/${p.token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-400">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Score Analysis (only if completed participants exist) */}
      {completed.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-gray-400" />
            Score-Verteilung
          </h2>
          <div className="flex items-end gap-2 h-32">
            {completed.map((p) => {
              const pct = p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0;
              return (
                <div key={p.id} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-gray-700">{pct}%</span>
                  <div
                    className={cn("w-full rounded-t transition-all", pct >= 75 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400")}
                    style={{ height: `${Math.max(pct, 5)}%` }}
                  />
                  <span className="text-[9px] text-gray-400 truncate max-w-full">
                    {p.employee.firstName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Employee free-text answers */}
      {(() => {
        // Parse the decisionTree once to build a sceneId → freeTextPrompt map
        let scenes: SceneNode[] = [];
        try {
          const parsed = JSON.parse(session.scenario.decisionTree);
          scenes = parsed.scenes ?? [];
        } catch {
          // ignore
        }

        // Also check for ISB-defined custom questions stored in customFields
        let customQuestions: { id: string; question: string; placeholder: string }[] = [];
        try {
          if (session.customFields) {
            const cf = JSON.parse(session.customFields) as Record<string, string>;
            if (cf.__customQuestions) {
              customQuestions = JSON.parse(cf.__customQuestions);
            }
          }
        } catch {
          // ignore
        }

        // Resolve question text for a given sceneId
        function getQuestionForScene(sceneId: number): string {
          // First check scene-specific custom question
          const cq = customQuestions.find((q) => q.id === `scene-${sceneId}`);
          if (cq) return cq.question;
          // Fall back to decisionTree freeTextPrompt
          const scene = scenes.find((s) => s.id === sceneId);
          return scene?.freeTextPrompt ?? `Szene ${sceneId}`;
        }

        const completedWithAnswers = completed.filter((p) => {
          if (!p.choices) return false;
          try {
            const choices: ParticipantChoice[] = JSON.parse(p.choices);
            return choices.some((c) => c.freeText && c.freeText.trim().length > 0);
          } catch {
            return false;
          }
        });

        if (completedWithAnswers.length === 0) return null;

        return (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                Antworten der Mitarbeiter
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Freitextantworten der Teilnehmer zu den Szenario-Fragen
              </p>
            </div>

            <div className="divide-y divide-gray-100">
              {completedWithAnswers.map((p) => {
                const isExpanded = expandedParticipants.has(p.id);
                let choices: ParticipantChoice[] = [];
                try {
                  choices = JSON.parse(p.choices ?? "[]");
                } catch {
                  // ignore
                }
                const answeredChoices = choices.filter((c) => c.freeText && c.freeText.trim().length > 0);
                const pct = p.maxScore > 0 ? Math.round((p.score / p.maxScore) * 100) : 0;

                return (
                  <div key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggleParticipant(p.id)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/60 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-500">
                            {p.employee.firstName[0]}{p.employee.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {p.employee.firstName} {p.employee.lastName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {answeredChoices.length} {answeredChoices.length === 1 ? "Antwort" : "Antworten"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "text-xs font-semibold",
                          pct >= 75 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"
                        )}>
                          {pct}%
                        </span>
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 text-gray-400 transition-transform duration-200",
                            isExpanded && "rotate-180"
                          )}
                        />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-6 pb-5 space-y-3 bg-gray-50/40">
                        {answeredChoices.map((choice, idx) => {
                          const questionText = getQuestionForScene(choice.sceneId);
                          const scene = scenes.find((s) => s.id === choice.sceneId);
                          const choiceObj = scene?.choices.find((c) => c.id === choice.choiceId);
                          const scoreForScene = choiceObj?.score ?? null;
                          const maxForScene = scene
                            ? Math.max(...scene.choices.map((c) => c.score))
                            : null;

                          return (
                            <div
                              key={`${p.id}-${choice.sceneId}-${idx}`}
                              className="rounded-lg border border-gray-200 bg-white p-4 space-y-2"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-xs font-semibold text-gray-500 leading-relaxed">
                                  {questionText}
                                </p>
                                {scoreForScene !== null && maxForScene !== null && (
                                  <span className={cn(
                                    "flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full",
                                    scoreForScene === maxForScene
                                      ? "bg-emerald-50 text-emerald-700"
                                      : scoreForScene > 0
                                      ? "bg-amber-50 text-amber-700"
                                      : "bg-red-50 text-red-600"
                                  )}>
                                    {scoreForScene}/{maxForScene} Pkt.
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {choice.freeText}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

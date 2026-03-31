"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AlertTriangle, Loader2 } from "lucide-react";

// Dynamic import for 3D game engine (no SSR)
const GameEngine = dynamic(
  () => import("@/components/simulation-3d/game-engine"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1628] to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white/60 text-lg font-medium">3D-Simulation wird geladen...</p>
          <p className="text-white/30 text-sm mt-1">Bitte warten</p>
        </div>
      </div>
    ),
  }
);

interface ParticipantData {
  participant: {
    id: string;
    token: string;
    status: string;
    currentScene: number;
    score: number;
    maxScore: number;
  };
  employee: {
    firstName: string;
    lastName: string;
  };
  session: {
    id: string;
    title: string;
    scenario: {
      code: string;
      category: string;
    };
  };
}

export default function SimulationPlayerPage() {
  const params = useParams();
  const token = params.token as string;
  const sessionId = params.sessionId as string;

  const [data, setData] = useState<ParticipantData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  // Load participant data
  useEffect(() => {
    fetch(`/api/simulations/play/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Ungültiger oder abgelaufener Link");
        return r.json();
      })
      .then((d: ParticipantData) => {
        setData(d);
        if (d.participant.status === "completed") {
          setCompleted(true);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Handle game completion
  const handleComplete = useCallback(
    async (
      score: number,
      maxScore: number,
      choices: Array<{
        sceneId: number;
        choiceId: string;
        freeText?: string;
        timeSpentSec: number;
        score: number;
        maxScore: number;
      }>
    ) => {
      // Save each choice to the API
      for (const choice of choices) {
        try {
          await fetch(`/api/simulations/play/${token}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sceneId: choice.sceneId,
              choiceId: choice.choiceId,
              freeText: choice.freeText,
              timeSpentSec: choice.timeSpentSec,
            }),
          });
        } catch (err) {
          console.error("Failed to save choice:", err);
        }
      }

      // Mark as completed
      try {
        await fetch(`/api/simulations/play/${token}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timeTakenSec: choices.reduce((sum, c) => sum + c.timeSpentSec, 0),
          }),
        });
      } catch (err) {
        console.error("Failed to mark completion:", err);
      }

      setCompleted(true);
    },
    [token]
  );

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1628] to-slate-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  // Error
  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1628] to-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            Simulation nicht verfügbar
          </h1>
          <p className="text-white/50 text-sm">
            {error ?? "Der Link ist ungültig oder abgelaufen."}
          </p>
          <p className="text-white/30 text-xs mt-4">
            Bitte kontaktieren Sie Ihren ISB für einen neuen Link.
          </p>
        </div>
      </div>
    );
  }

  // Already completed
  if (completed && data.participant.status === "completed") {
    const pct =
      data.participant.maxScore > 0
        ? Math.round(
            (data.participant.score / data.participant.maxScore) * 100
          )
        : 0;
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0a1628] to-slate-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-cyan-600 flex items-center justify-center mb-6">
            <span className="text-3xl font-bold text-white">{pct}%</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            Bereits abgeschlossen
          </h1>
          <p className="text-white/50 text-sm">
            Sie haben diese Simulation bereits durchgeführt.
          </p>
          <p className="text-white/30 text-xs mt-4">
            Score: {data.participant.score} / {data.participant.maxScore} Punkte
          </p>
        </div>
      </div>
    );
  }

  // 3D Game
  return (
    <GameEngine
      participantName={`${data.employee.firstName} ${data.employee.lastName}`}
      sessionTitle={data.session.title}
      scenarioCategory={data.session.scenario.category}
      token={token}
      onComplete={handleComplete}
    />
  );
}

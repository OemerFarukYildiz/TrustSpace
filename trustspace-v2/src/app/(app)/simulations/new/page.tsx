"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Shield,
  Flame,
  Database,
  Server,
  ChevronLeft,
  ChevronRight,
  Users,
  Clock,
  Loader2,
  CheckCircle2,
  Calendar,
  Plus,
  Trash2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Scenario {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedMinutes: number;
  decisionTree: string;
}

interface CustomQuestion {
  id: string;
  question: string;
  placeholder: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  role?: string;
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  cyber: Shield,
  physical: Flame,
  data: Database,
  operational: Server,
};

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string; gradient: string }> = {
  cyber: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", gradient: "from-red-500 to-orange-500" },
  physical: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", gradient: "from-orange-500 to-amber-500" },
  data: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", gradient: "from-purple-500 to-pink-500" },
  operational: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", gradient: "from-blue-500 to-cyan-500" },
};

export default function NewSimulationPage() {
  const router = useRouter();

  const [step, setStep] = useState(1); // 1: Szenario, 2: Konfiguration, 3: Teilnehmer
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedScenarioId, setSelectedScenarioId] = useState("");
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [customFields, setCustomFields] = useState<Record<string, string>>({});
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [customQuestions, setCustomQuestions] = useState<CustomQuestion[]>([]);

  // Load data
  useEffect(() => {
    Promise.all([
      fetch("/api/simulations/scenarios").then((r) => r.json()),
      fetch("/api/employees").then((r) => r.json()),
    ])
      .then(([s, e]) => {
        setScenarios(Array.isArray(s) ? s : []);
        setEmployees(Array.isArray(e) ? e : []);
      })
      .finally(() => setLoading(false));
  }, []);

  // Extract placeholders from selected scenario
  const selectedScenario = scenarios.find((s) => s.id === selectedScenarioId);
  const placeholders: string[] = [];
  if (selectedScenario) {
    const matches = selectedScenario.decisionTree.match(/\{\{(\w+)\}\}/g);
    if (matches) {
      const unique = [...new Set(matches.map((m) => m.replace(/\{|\}/g, "")))];
      placeholders.push(...unique);
    }
  }

  // Auto-set title and extract default questions when scenario changes
  useEffect(() => {
    if (selectedScenario && !title) {
      setTitle(`${selectedScenario.title} - ${new Date().toLocaleDateString("de-DE")}`);
    }
    if (selectedScenario) {
      try {
        const parsed = JSON.parse(selectedScenario.decisionTree);
        const scenes: { id: number; freeTextPrompt?: string }[] = parsed.scenes ?? [];
        const extracted: CustomQuestion[] = scenes
          .filter((sc) => sc.freeTextPrompt)
          .map((sc) => ({
            id: `scene-${sc.id}`,
            question: sc.freeTextPrompt!,
            placeholder: "Ihre Antwort...",
          }));
        setCustomQuestions(extracted);
      } catch {
        setCustomQuestions([]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedScenarioId]);

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((e) => e.id));
    }
  };

  function addQuestion() {
    setCustomQuestions((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, question: "", placeholder: "Ihre Antwort..." },
    ]);
  }

  function removeQuestion(id: string) {
    setCustomQuestions((prev) => prev.filter((q) => q.id !== id));
  }

  function updateQuestion(id: string, field: "question" | "placeholder", value: string) {
    setCustomQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
  }

  async function handleSubmit() {
    if (!selectedScenarioId || selectedEmployees.length === 0) return;
    setSubmitting(true);
    try {
      // Merge placeholder replacements and custom questions into customFields
      const mergedFields: Record<string, string> = { ...customFields };
      if (customQuestions.length > 0) {
        mergedFields.__customQuestions = JSON.stringify(customQuestions);
      }
      const res = await fetch("/api/simulations/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: selectedScenarioId,
          title,
          deadline: deadline || undefined,
          customFields: Object.keys(mergedFields).length > 0 ? mergedFields : undefined,
          employeeIds: selectedEmployees,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/simulations/${data.id}`);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0066FF]" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/simulations">
          <Button variant="ghost" size="sm" className="text-gray-500">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Zurück
          </Button>
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Neue Simulation erstellen</h1>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {[
          { num: 1, label: "Szenario" },
          { num: 2, label: "Konfiguration" },
          { num: 3, label: "Teilnehmer" },
        ].map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            {i > 0 && <div className="w-8 h-px bg-gray-200" />}
            <button
              onClick={() => step > s.num && setStep(s.num)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                step === s.num
                  ? "bg-[#0066FF] text-white"
                  : step > s.num
                  ? "bg-emerald-100 text-emerald-700 cursor-pointer"
                  : "bg-gray-100 text-gray-400"
              )}
            >
              {step > s.num ? <CheckCircle2 className="w-3.5 h-3.5" /> : <span>{s.num}</span>}
              {s.label}
            </button>
          </div>
        ))}
      </div>

      {/* Step 1: Szenario auswählen */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Wählen Sie ein Notfallszenario für die Übung aus.</p>
          <div className="grid grid-cols-2 gap-4">
            {scenarios.map((scenario) => {
              const Icon = CATEGORY_ICONS[scenario.category] ?? AlertTriangle;
              const colors = CATEGORY_COLORS[scenario.category] ?? CATEGORY_COLORS.cyber;
              const isSelected = selectedScenarioId === scenario.id;
              const parsed = JSON.parse(scenario.decisionTree || '{}');
              const sceneCount = parsed.scenes?.length ?? parsed.meta?.totalScenes ?? 0;

              return (
                <button
                  key={scenario.id}
                  onClick={() => setSelectedScenarioId(scenario.id)}
                  className={cn(
                    "text-left p-5 rounded-xl border-2 transition-all",
                    isSelected
                      ? `${colors.border} ${colors.bg} shadow-md`
                      : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0", colors.gradient)}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">{scenario.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{scenario.description}</p>
                      <div className="flex items-center gap-3 mt-3 text-[10px] text-gray-400">
                        <span className={cn("px-1.5 py-0.5 rounded font-medium",
                          scenario.difficulty === "easy" ? "bg-emerald-50 text-emerald-600" :
                          scenario.difficulty === "hard" ? "bg-red-50 text-red-600" :
                          "bg-amber-50 text-amber-600"
                        )}>
                          {scenario.difficulty === "easy" ? "Leicht" : scenario.difficulty === "hard" ? "Schwer" : "Mittel"}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          ~{scenario.estimatedMinutes} Min
                        </span>
                        <span>{sceneCount} Szenen</span>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className={cn("w-5 h-5 flex-shrink-0", colors.text)} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedScenarioId}
              className="bg-[#0066FF] hover:bg-blue-700"
            >
              Weiter
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Konfiguration */}
      {step === 2 && (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">Passen Sie die Simulation an Ihr Unternehmen an.</p>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div>
              <Label className="text-xs font-semibold text-gray-700">Titel</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-gray-700">Deadline (optional)</Label>
              <Input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {placeholders.length > 0 && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Unternehmensspezifische Felder
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {placeholders.map((ph) => (
                    <div key={ph}>
                      <Label className="text-xs text-gray-500">{ph.replace(/_/g, " ")}</Label>
                      <Input
                        value={customFields[ph] ?? ""}
                        onChange={(e) => setCustomFields((prev) => ({ ...prev, [ph]: e.target.value }))}
                        placeholder={`z.B. ${ph === "ISB_NAME" ? "Max Mustermann" : ph === "IT_LEITER" ? "Lisa Schmidt" : ph === "SERVERRAUM_STANDORT" ? "Gebäude B, Keller" : "..."}`}
                        className="mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Questions editor */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#0066FF]" />
                  Fragen für die Mitarbeiter
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Freitextfragen, die Mitarbeiter während der Simulation beantworten sollen.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addQuestion}
                className="text-xs h-8 gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Frage hinzufügen
              </Button>
            </div>

            {customQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-gray-200 bg-gray-50/60">
                <MessageSquare className="w-6 h-6 text-gray-300 mb-2" />
                <p className="text-xs text-gray-400">Keine Fragen vorhanden.</p>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="mt-2 text-xs text-[#0066FF] hover:underline"
                >
                  Erste Frage hinzufügen
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {customQuestions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="group rounded-lg border border-gray-200 bg-gray-50/40 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                        Frage {idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(q.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 font-medium">Fragetext</Label>
                      <Textarea
                        value={q.question}
                        onChange={(e) => updateQuestion(q.id, "question", e.target.value)}
                        placeholder="z.B. Wen informieren Sie als erstes und warum?"
                        className="mt-1.5 text-sm resize-none"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 font-medium">Hinweistext (Platzhalter)</Label>
                      <Input
                        value={q.placeholder}
                        onChange={(e) => updateQuestion(q.id, "placeholder", e.target.value)}
                        placeholder="z.B. Ihre Antwort..."
                        className="mt-1.5 text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>
            <Button onClick={() => setStep(3)} className="bg-[#0066FF] hover:bg-blue-700">
              Weiter
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Teilnehmer */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Wählen Sie die Mitarbeiter aus die teilnehmen sollen.</p>
            <Button variant="outline" size="sm" onClick={selectAll} className="text-xs">
              {selectedEmployees.length === employees.length ? "Keine auswählen" : "Alle auswählen"}
            </Button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            {employees.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Keine Mitarbeiter gefunden</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {employees.map((emp) => {
                  const isSelected = selectedEmployees.includes(emp.id);
                  return (
                    <button
                      key={emp.id}
                      onClick={() => toggleEmployee(emp.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-5 py-3 text-left transition-colors",
                        isSelected ? "bg-blue-50/50" : "hover:bg-gray-50"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors",
                        isSelected ? "bg-[#0066FF] border-[#0066FF]" : "border-gray-300"
                      )}>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{emp.email}</p>
                      </div>
                      <span className="text-xs text-gray-400">{emp.role}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedEmployees.length > 0 && (
            <p className="text-xs text-[#0066FF] font-medium">
              {selectedEmployees.length} Mitarbeiter ausgewählt
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Zurück
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting || selectedEmployees.length === 0}
              className="bg-[#0066FF] hover:bg-blue-700"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="w-4 h-4 mr-2" />
              )}
              Simulation erstellen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

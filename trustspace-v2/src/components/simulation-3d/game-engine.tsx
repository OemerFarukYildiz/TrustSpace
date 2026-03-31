"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Trophy,
  Star,
  Play,
  Server,
  Shield,
  Flame,
  Database,
  Zap,
  Send,
  PenLine,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RANSOMWARE_SCENES } from "./scenarios/ransomware";
import { SERVER_FIRE_SCENES } from "./scenarios/server-fire";
import { DATA_BREACH_SCENES } from "./scenarios/data-breach";

// Dynamic imports for 3D scenes (no SSR)
const SceneLoader = () => (
  <div className="w-full h-full flex items-center justify-center bg-[#050810]">
    <div className="text-center">
      <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-white/50 text-sm">3D-Szene wird geladen...</p>
    </div>
  </div>
);

const ServerRoomScene = dynamic(() => import("./server-room"), { ssr: false, loading: SceneLoader });
const FactoryFloorScene = dynamic(() => import("./factory-floor"), { ssr: false, loading: SceneLoader });

// ─── Types ───────────────────────────────────────────────────────────────────

interface GameScene {
  id: number;
  phase: string;
  title: string;
  narrative: string;
  alertLevel: "normal" | "warning" | "critical";
  interactiveObjects: string[];
  serverStatuses: Record<string, "healthy" | "warning" | "critical" | "offline">;
  objectTrigger: string | null; // null = skip explore, go straight to writing
  timeLimitSec: number | null;
  prompts: {
    question: string;
    placeholder: string;
    hint?: string;
  }[];
  optimalActions: string[];
  keyTerms: string[]; // keywords that indicate good understanding
  maxScore: number;
}

// ─── Produktionsausfall Scenes (inline, original scenario) ────────────────────

const PRODUCTION_SCENES: GameScene[] = [
  {
    id: 0,
    phase: "MASCHINENAUSFALL",
    title: "Die Anlage steht still",
    narrative:
      "Montagmorgen, 07:48 Uhr. Sie kommen in die Produktionshalle. " +
      "Sofort sehen Sie: Die Ampeln an beiden Fertigungslinien zeigen Rot. " +
      "Die Maschinen stehen still, Förderbänder laufen nicht. Am Bedienfeld blinken Fehlermeldungen. " +
      "Ihre Kollegen stehen ratlos daneben.\n\n" +
      "Gehen Sie zur ausgefallenen Maschine.",
    alertLevel: "critical",
    interactiveObjects: ["srv-db", "srv-app", "monitor-main"],
    serverStatuses: {
      "srv-db": "critical", "srv-app": "critical", "srv-web": "warning",
      "srv-mail": "healthy", "srv-backup": "healthy", "srv-monitor": "healthy", "srv-firewall": "healthy",
    },
    objectTrigger: "srv-db",
    timeLimitSec: 180,
    prompts: [
      {
        question: "Was tun Sie als Erstes, wenn Sie den Stillstand bemerken?",
        placeholder: "Beschreiben Sie Ihre erste Handlung...",
        hint: "Sicherheit zuerst. Wer muss informiert werden?",
      },
      {
        question: "Wen informieren Sie in welcher Reihenfolge?",
        placeholder: "z.B. Schichtleiter, Instandhaltung, Betriebsleiter...",
      },
    ],
    optimalActions: [
      "Nicht eigenständig an der Maschine arbeiten oder Sicherheitseinrichtungen umgehen",
      "Schichtleiter / Vorgesetzten sofort informieren",
      "Fehlermeldung am Bedienfeld ablesen und notieren (Fehlercode, Zeitstempel)",
      "Gefahrenbereich absichern, Kollegen warnen",
      "Vorfall im Schichtbuch dokumentieren",
    ],
    keyTerms: ["Schichtleiter", "informieren", "melden", "Fehlercode", "dokumentieren", "nicht anfassen", "Sicherheit", "absichern", "Schichtbuch", "Vorgesetzter", "Instandhaltung"],
    maxScore: 10,
  },
  {
    id: 1,
    phase: "VERLETZUNG",
    title: "Ein Kollege ist verletzt",
    narrative:
      "Während der Fehlersuche an der Anlage hören Sie einen Schrei. " +
      "Ein Kollege an Fertigungslinie 2 hat sich an einer Maschine verletzt — " +
      "er hält sich den Arm, Blut ist sichtbar. Die Maschine hat durch die Sicherheitsabschaltung gestoppt. " +
      "Andere Kollegen stehen herum, unsicher was zu tun ist.\n\n" +
      "Hier ist sofortiges Handeln gefragt!",
    alertLevel: "critical",
    interactiveObjects: ["monitor-phone"],
    serverStatuses: {
      "srv-db": "critical", "srv-app": "critical", "srv-web": "offline",
      "srv-mail": "critical", "srv-backup": "healthy", "srv-monitor": "warning", "srv-firewall": "healthy",
    },
    objectTrigger: null,
    timeLimitSec: 120,
    prompts: [
      {
        question: "Was sind Ihre ersten drei Handlungen bei einem verletzten Kollegen?",
        placeholder: "1. ...\n2. ...\n3. ...",
        hint: "Denken Sie an: Szene sichern, Erste Hilfe, Notruf",
      },
      {
        question: "Welche Informationen geben Sie beim Notruf 112 durch?",
        placeholder: "Was melden Sie der Leitstelle?",
      },
    ],
    optimalActions: [
      "Szene sichern: Maschine ist gestoppt (NOT-AUS gedrückt), Bereich absperren",
      "Ersthelfer rufen, Notruf 112 absetzen (Wer, Wo, Was, Wie viele, Warten)",
      "Verletzte Person NICHT bewegen, Erste Hilfe leisten (Blutung stillen, beruhigen)",
      "Jemanden zum Werkstor schicken um Rettungsdienst einzuweisen",
      "Vorfall im Verbandbuch dokumentieren",
    ],
    keyTerms: ["112", "Notruf", "Ersthelfer", "Erste Hilfe", "NOT-AUS", "absichern", "nicht bewegen", "Verbandbuch", "Rettungsdienst", "einweisen", "Schichtleiter", "dokumentieren"],
    maxScore: 10,
  },
  {
    id: 2,
    phase: "BRANDGEFAHR",
    title: "Rauch in der Halle!",
    narrative:
      "Nachdem der Rettungsdienst eingetroffen ist, bemerken Sie einen beißenden Geruch. " +
      "Aus dem Schaltschrank an der Wand steigt dünner Rauch auf. " +
      "Ein Kollege will den Schaltschrank öffnen um nachzusehen. " +
      "Die Brandmeldeanlage hat noch nicht ausgelöst.\n\n" +
      "Gehen Sie zum Stromverteiler.",
    alertLevel: "critical",
    interactiveObjects: ["network-switch", "emergency-stop", "monitor-phone"],
    serverStatuses: {
      "srv-db": "warning", "srv-app": "offline", "srv-web": "offline",
      "srv-mail": "healthy", "srv-backup": "healthy", "srv-monitor": "healthy", "srv-firewall": "critical",
    },
    objectTrigger: "network-switch",
    timeLimitSec: 90,
    prompts: [
      {
        question: "Was tun Sie, wenn Sie Rauch aus dem Schaltschrank bemerken?",
        placeholder: "Ihre Sofortmaßnahmen...",
        hint: "Schaltschrank öffnen oder nicht? Welchen Feuerlöscher?",
      },
      {
        question: "Ihr Kollege will den Schaltschrank öffnen. Was sagen Sie ihm?",
        placeholder: "Ihre Anweisung an den Kollegen...",
      },
      {
        question: "Wie verläuft die Evakuierung?",
        placeholder: "Fluchtweg, Sammelplatz, Personenzählung...",
      },
    ],
    optimalActions: [
      "Schaltschrank NICHT öffnen — Sauerstoffzufuhr kann Feuer entfachen",
      "Handfeuermelder (Brandmelder) sofort betätigen",
      "Feuerwehr rufen (112) falls nicht automatisch alarmiert",
      "CO2-Feuerlöscher verwenden (NICHT Wasser bei Elektrobrand)",
      "Bereich räumen, Fluchtweg nutzen, zum Sammelplatz gehen",
      "Alle Kollegen zählen — fehlende Personen melden",
    ],
    keyTerms: ["nicht öffnen", "Brandmelder", "Feuerwehr", "112", "CO2", "kein Wasser", "Elektrobrand", "Fluchtweg", "Sammelplatz", "evakuieren", "Personen zählen", "räumen"],
    maxScore: 10,
  },
  {
    id: 3,
    phase: "STROMAUSFALL",
    title: "Kompletter Stromausfall",
    narrative:
      "Plötzlich wird es dunkel. Alle Maschinen stoppen, die Lichter gehen aus. " +
      "Nur die Notbeleuchtung und die grünen Fluchtweg-Schilder leuchten. " +
      "In der Halle herrscht Stille — nur das Piepen der USV-Anlagen ist zu hören. " +
      "Ein Maschinenarm ist mitten in der Bewegung stehengeblieben, ein Werkstück hängt in der Luft.\n\n" +
      "Es ist dunkel — Sie müssen sofort reagieren!",
    alertLevel: "critical",
    interactiveObjects: [],
    serverStatuses: {
      "srv-db": "offline", "srv-app": "offline", "srv-web": "offline",
      "srv-mail": "offline", "srv-backup": "offline", "srv-monitor": "offline", "srv-firewall": "offline",
    },
    objectTrigger: null,
    timeLimitSec: 120,
    prompts: [
      {
        question: "Was sind Ihre ersten Maßnahmen bei einem kompletten Stromausfall?",
        placeholder: "Sicherheit, Kommunikation, Verhalten...",
        hint: "Stehen bleiben? Maschinen? Kollegen?",
      },
      {
        question: "Welche Gefahren bestehen, wenn der Strom plötzlich wiederkommt?",
        placeholder: "Risiken beim Wiederanlauf...",
      },
    ],
    optimalActions: [
      "Ruhig bleiben, Augen an Notbeleuchtung gewöhnen lassen",
      "Alle laufenden Maschinen auf AUS stellen (verhindert unkontrollierten Wiederanlauf)",
      "Abstand von Maschinen halten — gespeicherte Energie (Hydraulik, Pneumatik) kann freiwerden",
      "Keine offenen Flammen (Feuerzeug) verwenden — Gasansammlungen möglich",
      "Kollegen in der Nähe prüfen — ist jemand in einer Gefahrenzone?",
      "Auf Anweisungen des Schichtleiters warten",
    ],
    keyTerms: ["ruhig bleiben", "Maschinen aus", "Wiederanlauf", "Abstand", "Hydraulik", "keine Flammen", "Kollegen prüfen", "Schichtleiter", "Notbeleuchtung", "Fluchtweg", "gespeicherte Energie"],
    maxScore: 10,
  },
  {
    id: 4,
    phase: "QUALITÄTSPROBLEM",
    title: "Fehlerhafte Produktion entdeckt",
    narrative:
      "Der Strom ist wieder da, die Anlagen laufen an. Bei der Kontrolle der letzten Charge " +
      "stellen Sie fest: Die letzten 200 Teile haben einen sichtbaren Fehler. " +
      "Sie sind bereits auf dem Förderband zur Verpackung. Der Schichtleiter drängt: " +
      "\"Wir müssen die Bestellung heute raus bekommen!\"\n\n" +
      "Gehen Sie zum Bedienfeld.",
    alertLevel: "warning",
    interactiveObjects: ["srv-monitor", "monitor-main", "monitor-email"],
    serverStatuses: {
      "srv-db": "warning", "srv-app": "healthy", "srv-web": "healthy",
      "srv-mail": "healthy", "srv-backup": "healthy", "srv-monitor": "warning", "srv-firewall": "healthy",
    },
    objectTrigger: "srv-monitor",
    timeLimitSec: 120,
    prompts: [
      {
        question: "Der Schichtleiter will die fehlerhaften Teile trotzdem ausliefern. Was tun Sie?",
        placeholder: "Ihre Entscheidung und Begründung...",
        hint: "Qualität vs. Liefertermin — was hat Vorrang?",
      },
      {
        question: "Wie gehen Sie mit den fehlerhaften Teilen um?",
        placeholder: "Kennzeichnung, Sperrung, Dokumentation...",
      },
    ],
    optimalActions: [
      "Fertigung stoppen — jeder Mitarbeiter hat das Recht und die Pflicht, bei Qualitätsmängeln die Linie anzuhalten",
      "Fehlerhafte Teile sofort kennzeichnen und in das Sperrlager bringen",
      "Qualitätssicherung (QS) und Schichtleiter informieren",
      "Dokumentieren: Teilenummer, Stückzahl, Fehlerart, Zeitpunkt",
      "NICHT ausliefern — Rückrufkosten und Haftungsrisiken überwiegen den Lieferverzug",
    ],
    keyTerms: ["stoppen", "Linie anhalten", "Sperrlager", "kennzeichnen", "QS", "Qualitätssicherung", "dokumentieren", "nicht ausliefern", "Rückruf", "Haftung", "Fehler", "Teilenummer"],
    maxScore: 10,
  },
  {
    id: 5,
    phase: "FREMDE PERSON",
    title: "Unbefugte Person in der Halle",
    narrative:
      "Während Sie an Ihrem Arbeitsplatz sind, fällt Ihnen eine fremde Person auf. " +
      "Sie trägt keine Schutzausrüstung, keinen Besucherausweis und fotografiert mit dem Handy " +
      "die Fertigungslinie. Die Person bewegt sich im Gabelstapler-Bereich.\n\n" +
      "Gehen Sie zum Telefon.",
    alertLevel: "warning",
    interactiveObjects: ["monitor-phone", "monitor-main", "monitor-email"],
    serverStatuses: {
      "srv-db": "healthy", "srv-app": "healthy", "srv-web": "healthy",
      "srv-mail": "healthy", "srv-backup": "healthy", "srv-monitor": "healthy", "srv-firewall": "warning",
    },
    objectTrigger: "monitor-phone",
    timeLimitSec: 90,
    prompts: [
      {
        question: "Wie verhalten Sie sich gegenüber der fremden Person?",
        placeholder: "Ihre Ansprache und Vorgehensweise...",
        hint: "Freundlich aber bestimmt. Sicherheit hat Vorrang.",
      },
      {
        question: "Wen informieren Sie und warum?",
        placeholder: "Meldekette und Begründung...",
      },
    ],
    optimalActions: [
      "Person höflich aber bestimmt ansprechen: Besucherausweis? Ansprechpartner?",
      "Person aus dem Gefahrenbereich (Gabelstapler-Zone) herausführen",
      "Werkschutz / Schichtleiter sofort informieren",
      "Fotografieren unterbinden — Betriebsgeheimnisse / Industriespionage",
      "Person NICHT körperlich festhalten, aber Sichtkontakt halten",
    ],
    keyTerms: ["ansprechen", "Besucherausweis", "Gefahrenbereich", "Werkschutz", "Schichtleiter", "Fotografieren", "Betriebsgeheimnis", "nicht festhalten", "Sichtkontakt", "melden", "Schutzausrüstung"],
    maxScore: 10,
  },
  {
    id: 6,
    phase: "GEFAHRSTOFF",
    title: "Chemikalie ausgelaufen!",
    narrative:
      "In der Reinigungsstation ist ein 25-Liter-Kanister Industriereiniger vom Regal gefallen und aufgeplatzt. " +
      "Ein scharfer chemischer Geruch breitet sich aus. Die Flüssigkeit läuft über den Boden Richtung Abfluss. " +
      "Ein Kollege, der daneben stand, hat Spritzer an Armen und im Gesicht.\n\n" +
      "Schnelles Handeln ist gefragt — Ihr Kollege braucht sofort Hilfe!",
    alertLevel: "critical",
    interactiveObjects: ["monitor-phone"],
    serverStatuses: {
      "srv-db": "healthy", "srv-app": "healthy", "srv-web": "healthy",
      "srv-mail": "healthy", "srv-backup": "healthy", "srv-monitor": "critical", "srv-firewall": "warning",
    },
    objectTrigger: null,
    timeLimitSec: 90,
    prompts: [
      {
        question: "Wie helfen Sie dem betroffenen Kollegen?",
        placeholder: "Erste-Hilfe-Maßnahmen...",
        hint: "Augendusche? Notdusche? Was sagt das Sicherheitsdatenblatt?",
      },
      {
        question: "Wie verhindern Sie, dass die Chemikalie in den Abfluss gelangt?",
        placeholder: "Eindämmungsmaßnahmen...",
      },
      {
        question: "Welche Informationen brauchen Sie vom Sicherheitsdatenblatt?",
        placeholder: "Welche Abschnitte sind jetzt relevant?",
      },
    ],
    optimalActions: [
      "Betroffenen Kollegen sofort zur Augendusche / Notdusche bringen — 15 Min. spülen",
      "Sicherheitsdatenblatt (SDB) prüfen — Abschnitt 4 (Erste Hilfe) und Abschnitt 6 (Verschütten)",
      "Bereich absperren, Kollegen warnen, Bereich lüften",
      "Bindemittel verwenden um Ausbreitung zu stoppen — NICHT in den Abfluss laufen lassen",
      "NICHT ohne Schutzausrüstung (Handschuhe, Schutzbrille) in die Lache treten",
      "Gefahrstoffbeauftragten und Schichtleiter informieren",
    ],
    keyTerms: ["Augendusche", "Notdusche", "spülen", "Sicherheitsdatenblatt", "SDB", "Bindemittel", "absperren", "lüften", "Schutzausrüstung", "Handschuhe", "Abfluss", "Gefahrstoffbeauftragter", "nicht betreten"],
    maxScore: 10,
  },
  {
    id: 7,
    phase: "NACHBEREITUNG",
    title: "Was haben wir gelernt?",
    narrative:
      "Der Notfalltag ist vorbei. Alle Vorfälle sind dokumentiert, die Anlagen laufen wieder. " +
      "Der Betriebsleiter ruft das Team zusammen: Was lief gut? Was müssen wir verbessern? " +
      "Welche Maßnahmen ergreifen wir, damit so etwas nicht wieder passiert?\n\n" +
      "Gehen Sie zum Leitstand für die Nachbesprechung.",
    alertLevel: "normal",
    interactiveObjects: ["monitor-main", "srv-backup", "monitor-email"],
    serverStatuses: {
      "srv-db": "healthy", "srv-app": "healthy", "srv-web": "healthy",
      "srv-mail": "healthy", "srv-backup": "healthy", "srv-monitor": "healthy", "srv-firewall": "healthy",
    },
    objectTrigger: "monitor-main",
    timeLimitSec: null,
    prompts: [
      {
        question: "Was lief heute gut — was haben die Mitarbeiter richtig gemacht?",
        placeholder: "Positive Punkte...",
      },
      {
        question: "Welche konkreten Verbesserungen schlagen Sie vor?",
        placeholder: "Maßnahmen für die Zukunft...",
      },
      {
        question: "Welche Schulungen oder Übungen sind notwendig?",
        placeholder: "Schulungsbedarf...",
      },
    ],
    optimalActions: [
      "Lessons-Learned Besprechung mit allen Beteiligten durchführen",
      "Notfallpläne aktualisieren basierend auf den Erkenntnissen des Tages",
      "Regelmäßige Evakuierungsübungen und Ersthelfer-Schulungen planen",
      "Sicherheitsdatenblätter aktuell und zugänglich halten",
      "Besuchermanagement überprüfen (Ausweispflicht, PSA, Begleitung)",
      "Alle Vorfälle in Verbandbuch / Unfallbericht / Schichtbuch dokumentieren",
    ],
    keyTerms: ["Lessons Learned", "Notfallplan", "Schulung", "Übung", "Evakuierung", "Ersthelfer", "Sicherheitsdatenblatt", "Besuchermanagement", "dokumentieren", "Verbesserung", "Verbandbuch"],
    maxScore: 10,
  },
];

// ─── Scenario Selection ──────────────────────────────────────────────────────

interface ScenarioConfig {
  scenes: GameScene[];
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  shadow: string;
  description: string;
  bgClass: string;
}

const SCENARIO_MAP: Record<string, ScenarioConfig> = {
  operational: {
    scenes: PRODUCTION_SCENES,
    icon: Server,
    gradient: "from-blue-600 to-cyan-600",
    shadow: "shadow-blue-900/40",
    description: "Produktionshalle steht still — Fertigungslinien, Roboter, Sabotage",
    bgClass: "from-slate-950 via-[#0a1628] to-slate-950",
  },
  cyber: {
    scenes: RANSOMWARE_SCENES as unknown as GameScene[],
    icon: Shield,
    gradient: "from-red-600 to-orange-600",
    shadow: "shadow-red-900/40",
    description: "Ransomware verschlüsselt Ihre Systeme — Lösegeldforderung in Bitcoin",
    bgClass: "from-slate-950 via-[#1a0a0a] to-slate-950",
  },
  physical: {
    scenes: SERVER_FIRE_SCENES as unknown as GameScene[],
    icon: Flame,
    gradient: "from-orange-500 to-amber-500",
    shadow: "shadow-orange-900/40",
    description: "Brandfrüherkennung im Serverraum — Rauch, Hitze, Evakuierung",
    bgClass: "from-slate-950 via-[#1a1005] to-slate-950",
  },
  data: {
    scenes: DATA_BREACH_SCENES as unknown as GameScene[],
    icon: Database,
    gradient: "from-purple-600 to-pink-600",
    shadow: "shadow-purple-900/40",
    description: "Datenleck mit 15.000 betroffenen Kunden — DSGVO 72-Stunden-Frist",
    bgClass: "from-slate-950 via-[#0f0a1a] to-slate-950",
  },
};

// ─── Score Evaluation ────────────────────────────────────────────────────────

function evaluateResponse(responses: string[], scene: GameScene): { score: number; matchedTerms: string[]; missedActions: string[] } {
  const combined = responses.join(" ").toLowerCase();
  const matchedTerms: string[] = [];

  for (const term of scene.keyTerms) {
    if (combined.includes(term.toLowerCase())) {
      matchedTerms.push(term);
    }
  }

  // Score based on keyword coverage
  const coverage = matchedTerms.length / Math.max(scene.keyTerms.length, 1);
  const rawScore = Math.round(coverage * scene.maxScore);
  const score = Math.min(rawScore, scene.maxScore);

  // Identify missed optimal actions (those not reflected in response)
  const missedActions = scene.optimalActions.filter((action) => {
    const actionWords = action.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    const matched = actionWords.filter((w) => combined.includes(w));
    return matched.length < actionWords.length * 0.3;
  });

  return { score, matchedTerms, missedActions };
}

// ─── Timer ───────────────────────────────────────────────────────────────────

function CountdownTimer({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const expiredRef = useRef(false);

  useEffect(() => { setRemaining(seconds); expiredRef.current = false; }, [seconds]);

  useEffect(() => {
    if (remaining <= 0 && !expiredRef.current) { expiredRef.current = true; onExpire(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onExpire]);

  const pct = (remaining / seconds) * 100;
  const isLow = remaining <= 15;

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-md border transition-all",
      isLow ? "bg-red-950/80 border-red-500/50 animate-pulse" : "bg-black/40 border-white/10"
    )}>
      <Clock className={cn("w-4 h-4", isLow ? "text-red-400" : "text-white/50")} />
      <span className={cn("font-mono text-sm font-bold tabular-nums", isLow ? "text-red-400" : "text-white")}>
        {Math.floor(remaining / 60)}:{(remaining % 60).toString().padStart(2, "0")}
      </span>
      <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000 ease-linear", isLow ? "bg-red-500" : "bg-blue-500")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ─── Main Game Engine ────────────────────────────────────────────────────────

interface GameEngineProps {
  participantName: string;
  sessionTitle: string;
  scenarioCategory: string;
  token: string;
  onComplete: (score: number, maxScore: number, choices: Array<{ sceneId: number; choiceId: string; freeText?: string; timeSpentSec: number; score: number; maxScore: number }>) => void;
}

export default function GameEngine({ participantName, sessionTitle, scenarioCategory, token, onComplete }: GameEngineProps) {
  const scenarioData = SCENARIO_MAP[scenarioCategory] ?? SCENARIO_MAP.operational;
  const scenes = scenarioData.scenes;
  const ScenarioIcon = scenarioData.icon;

  const [phase, setPhase] = useState<"intro" | "explore" | "writing" | "feedback" | "completed">("intro");
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [totalScore, setTotalScore] = useState(0);
  const [maxPossibleScore, setMaxPossibleScore] = useState(0);
  const [sceneStartTime, setSceneStartTime] = useState(Date.now());
  const [choiceHistory, setChoiceHistory] = useState<Array<{ sceneId: number; choiceId: string; freeText?: string; timeSpentSec: number; score: number; maxScore: number }>>([]);
  const [showNarrative, setShowNarrative] = useState(true);
  const [evaluation, setEvaluation] = useState<{ score: number; matchedTerms: string[]; missedActions: string[] } | null>(null);
  const [showHint, setShowHint] = useState<number | null>(null);

  const currentScene = scenes[currentSceneIndex];
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([]);

  // Init responses for current scene
  useEffect(() => {
    if (currentScene) {
      setResponses(new Array(currentScene.prompts.length).fill(""));
    }
  }, [currentSceneIndex, currentScene]);

  const handleObjectSelect = useCallback((objectId: string) => {
    if (phase === "explore" && currentScene.objectTrigger === objectId) {
      setPhase("writing");
      setTimeout(() => textareaRefs.current[0]?.focus(), 300);
    }
  }, [phase, currentScene]);

  const handleStart = useCallback(() => {
    setSceneStartTime(Date.now());
    setShowNarrative(true);
    setEvaluation(null);
    // If no objectTrigger, skip explore and go straight to writing
    if (!currentScene.objectTrigger) {
      setPhase("writing");
      setTimeout(() => textareaRefs.current[0]?.focus(), 300);
    } else {
      setPhase("explore");
    }
  }, [currentScene]);

  // Submit responses
  const handleSubmit = useCallback(() => {
    const allFilled = responses.some((r) => r.trim().length > 0);
    if (!allFilled) return;

    const result = evaluateResponse(responses, currentScene);
    setEvaluation(result);
    setPhase("feedback");

    const timeSpent = Math.floor((Date.now() - sceneStartTime) / 1000);
    setTotalScore((prev) => prev + result.score);
    setMaxPossibleScore((prev) => prev + currentScene.maxScore);

    setChoiceHistory((prev) => [
      ...prev,
      {
        sceneId: currentScene.id,
        choiceId: `scene-${currentScene.id}-freetext`,
        freeText: responses.join("\n---\n"),
        timeSpentSec: timeSpent,
        score: result.score,
        maxScore: currentScene.maxScore,
      },
    ]);
  }, [responses, currentScene, sceneStartTime]);

  const handleTimerExpire = useCallback(() => {
    if (phase === "writing") {
      handleSubmit();
    }
  }, [phase, handleSubmit]);

  const handleNext = useCallback(() => {
    if (currentSceneIndex >= scenes.length - 1) {
      setPhase("completed");
      onComplete(totalScore + (evaluation?.score ?? 0), maxPossibleScore + (evaluation ? currentScene.maxScore : 0), choiceHistory);
    } else {
      const nextScene = scenes[currentSceneIndex + 1];
      setCurrentSceneIndex((prev) => prev + 1);
      setResponses([]);
      setSceneStartTime(Date.now());
      setShowNarrative(true);
      setEvaluation(null);
      setShowHint(null);
      // If next scene has no objectTrigger, skip explore
      if (!nextScene.objectTrigger) {
        setPhase("writing");
        setTimeout(() => textareaRefs.current[0]?.focus(), 300);
      } else {
        setPhase("explore");
      }
    }
  }, [currentSceneIndex, scenes, totalScore, maxPossibleScore, evaluation, currentScene, choiceHistory, onComplete]);

  const scorePct = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  const stars = scorePct >= 90 ? 5 : scorePct >= 75 ? 4 : scorePct >= 60 ? 3 : scorePct >= 40 ? 2 : 1;

  // ─── Intro ─────────────────────────────────────────────────────────────

  if (phase === "intro") {
    return (
      <div className={cn("min-h-screen bg-gradient-to-br flex items-center justify-center p-6", scenarioData.bgClass)}>
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <div className={cn("w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6 shadow-2xl", scenarioData.gradient, scenarioData.shadow)}>
              <ScenarioIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{sessionTitle}</h1>
            <p className="text-white/40">3D Notfall-Simulation</p>
          </div>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 space-y-4 mb-8">
            <div className="flex justify-between">
              <span className="text-white/40 text-sm">Teilnehmer</span>
              <span className="text-white font-medium">{participantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-sm">Phasen</span>
              <span className="text-white font-medium">{scenes.length} Situationen</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-sm">Szenario</span>
              <span className={cn("font-medium text-sm max-w-[220px] text-right",
                scenarioCategory === "cyber" ? "text-red-400" :
                scenarioCategory === "physical" ? "text-orange-400" :
                scenarioCategory === "data" ? "text-purple-400" : "text-blue-400"
              )}>{scenarioData.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-sm">Eingabe</span>
              <span className="text-blue-400 font-medium flex items-center gap-1.5">
                <PenLine className="w-3.5 h-3.5" /> Freitext
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/40 text-sm">Geschätzte Dauer</span>
              <span className="text-white font-medium">~{Math.round(scenes.length * 3)} Minuten</span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
            <p className="text-blue-300/80 text-sm leading-relaxed">
              <PenLine className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              In jeder Phase sehen Sie eine Situation in einer interaktiven 3D-Umgebung.
              Klicken Sie auf leuchtende Objekte und <strong className="text-blue-200">beschreiben Sie in eigenen Worten</strong>,
              wie Sie handeln würden. Es gibt keine vorgegebenen Antworten — schreiben Sie frei!
            </p>
          </div>

          <button
            onClick={handleStart}
            className={cn("w-full py-4 rounded-xl font-bold text-lg text-white bg-gradient-to-r shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]", scenarioData.gradient)}
          >
            <Play className="w-5 h-5 inline mr-2 -mt-0.5" />
            Simulation starten
          </button>
        </div>
      </div>
    );
  }

  // ─── Completed ─────────────────────────────────────────────────────────

  if (phase === "completed") {
    return (
      <div className={cn("min-h-screen bg-gradient-to-br flex items-center justify-center p-6", scenarioData.bgClass)}>
        <div className="w-full max-w-xl text-center">
          <Trophy className={cn("w-16 h-16 mx-auto mb-4", scorePct >= 75 ? "text-amber-400" : scorePct >= 50 ? "text-white/60" : "text-red-400")} />
          <h1 className="text-3xl font-bold text-white mb-1">Simulation abgeschlossen!</h1>
          <p className="text-white/40 mb-6">{sessionTitle}</p>

          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-8 mb-6">
            <div className="relative w-36 h-36 mx-auto mb-4">
              <svg viewBox="0 0 36 36" className="w-36 h-36 -rotate-90">
                <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={scorePct >= 75 ? "#f59e0b" : scorePct >= 50 ? "#3b82f6" : "#ef4444"} strokeWidth="3" strokeDasharray={`${scorePct}, 100`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">{scorePct}%</span>
            </div>
            <p className="text-white/50 text-sm mb-3">{totalScore} / {maxPossibleScore} Punkte</p>
            <div className="flex justify-center gap-1 mb-4">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={cn("w-7 h-7", i < stars ? "text-amber-400 fill-amber-400" : "text-white/15")} />
              ))}
            </div>
            <p className={cn("text-sm font-medium", scorePct >= 90 ? "text-emerald-400" : scorePct >= 75 ? "text-amber-400" : scorePct >= 50 ? "text-blue-400" : "text-red-400")}>
              {scorePct >= 90 ? "Hervorragend! Sie sind bestens auf Notfälle vorbereitet." :
               scorePct >= 75 ? "Gut gemacht! Kleinere Verbesserungen möglich." :
               scorePct >= 50 ? "Solide Grundlage, aber Schulungsbedarf in einigen Bereichen." :
               "Erheblicher Schulungsbedarf. Bitte das Notfallhandbuch durcharbeiten."}
            </p>
          </div>

          {/* Phase breakdown */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 text-left mb-6">
            <h3 className="text-white font-semibold mb-3 text-sm">Ergebnisse pro Phase</h3>
            <div className="space-y-2">
              {choiceHistory.map((ch, i) => {
                const scene = scenes[i];
                const pct = ch.maxScore > 0 ? Math.round((ch.score / ch.maxScore) * 100) : 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-white/30 text-xs w-32 flex-shrink-0">{scene?.phase}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${pct}%` }} />
                    </div>
                    <span className={cn("text-xs font-mono w-10 text-right", pct >= 80 ? "text-emerald-400" : pct >= 50 ? "text-amber-400" : "text-red-400")}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-white/20 text-xs">
            Ihre Antworten und Ergebnisse wurden gespeichert und sind für den ISB in der TrustSpace-Plattform einsehbar.
          </p>
        </div>
      </div>
    );
  }

  // ─── Playing (3D + Writing) ────────────────────────────────────────────

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* 3D Scene */}
      <div className="absolute inset-0">
        {scenarioCategory === "operational" ? (
          <FactoryFloorScene
            alertLevel={currentScene.alertLevel}
            interactiveObjects={currentScene.interactiveObjects}
            serverStatuses={currentScene.serverStatuses}
            onObjectSelect={handleObjectSelect}
          />
        ) : (
          <ServerRoomScene
            alertLevel={currentScene.alertLevel}
            interactiveObjects={currentScene.interactiveObjects}
            serverStatuses={currentScene.serverStatuses}
            onObjectSelect={handleObjectSelect}
            scenarioCategory={scenarioCategory}
          />
        )}
      </div>

      {/* Top HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-md rounded-xl border border-white/10 px-4 py-2 flex items-center gap-3">
            <span className="text-xs text-white/40 uppercase tracking-wider font-semibold">{currentScene.phase}</span>
            <div className="w-px h-4 bg-white/20" />
            <span className="text-white/60 text-xs">{currentSceneIndex + 1} / {scenes.length}</span>
            <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" style={{ width: `${((currentSceneIndex + 1) / scenes.length) * 100}%` }} />
            </div>
          </div>
        </div>

        {(phase === "writing") && currentScene.timeLimitSec && (
          <div className="pointer-events-auto">
            <CountdownTimer seconds={currentScene.timeLimitSec} onExpire={handleTimerExpire} />
          </div>
        )}

        <div className="pointer-events-auto">
          <div className="bg-black/60 backdrop-blur-md rounded-xl border border-white/10 px-4 py-2 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-white font-mono text-sm font-bold">{totalScore}</span>
            <span className="text-white/30 text-xs">Punkte</span>
          </div>
        </div>
      </div>

      {/* Left Panel */}
      {showNarrative && (phase === "explore" || phase === "writing" || phase === "feedback") && (
        <div className="absolute left-4 top-20 bottom-4 w-[420px] pointer-events-auto z-10">
          <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 h-full flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  currentScene.alertLevel === "critical" ? "bg-red-600" : currentScene.alertLevel === "warning" ? "bg-amber-600" : "bg-blue-600"
                )}>
                  <AlertTriangle className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-white font-bold">{currentScene.title}</h2>
              </div>
              <p className="text-white/50 text-xs uppercase tracking-wider">Phase {currentSceneIndex + 1}: {currentScene.phase}</p>
            </div>

            {/* Content — scrollable */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Narrative */}
              <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">{currentScene.narrative}</p>

              {/* Explore hint */}
              {phase === "explore" && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 animate-pulse">
                  <p className="text-blue-400 text-xs flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                    Klicken Sie auf das leuchtende Objekt im 3D-Raum, um fortzufahren
                  </p>
                </div>
              )}

              {/* Writing prompts */}
              {phase === "writing" && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-400">
                    <PenLine className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Ihre Einschätzung</span>
                  </div>

                  {currentScene.prompts.map((prompt, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <label className="text-white/80 text-sm font-medium">{prompt.question}</label>
                        {prompt.hint && (
                          <button
                            onClick={() => setShowHint(showHint === i ? null : i)}
                            className="text-white/30 hover:text-amber-400 transition-colors flex-shrink-0"
                            title="Hinweis anzeigen"
                          >
                            <Lightbulb className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {showHint === i && prompt.hint && (
                        <p className="text-amber-400/70 text-xs bg-amber-500/10 rounded-lg px-3 py-2 border border-amber-500/20">
                          {prompt.hint}
                        </p>
                      )}
                      <textarea
                        ref={(el) => { textareaRefs.current[i] = el; }}
                        value={responses[i] ?? ""}
                        onChange={(e) => {
                          const next = [...responses];
                          next[i] = e.target.value;
                          setResponses(next);
                        }}
                        placeholder={prompt.placeholder}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.07] resize-none transition-colors"
                      />
                    </div>
                  ))}

                  <button
                    onClick={handleSubmit}
                    disabled={!responses.some((r) => r.trim().length > 0)}
                    className={cn(
                      "w-full py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2",
                      responses.some((r) => r.trim().length > 0)
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:scale-[1.01] active:scale-[0.99] shadow-lg"
                        : "bg-white/10 text-white/30 cursor-not-allowed"
                    )}
                  >
                    <Send className="w-4 h-4" />
                    Antwort absenden
                  </button>
                </div>
              )}

              {/* Feedback */}
              {phase === "feedback" && evaluation && (
                <div className="space-y-4">
                  {/* Score */}
                  <div className={cn(
                    "rounded-xl border p-4",
                    evaluation.score >= 8 ? "bg-emerald-500/10 border-emerald-500/30" :
                    evaluation.score >= 5 ? "bg-amber-500/10 border-amber-500/30" :
                    "bg-red-500/10 border-red-500/30"
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className={cn("w-5 h-5",
                        evaluation.score >= 8 ? "text-emerald-400" : evaluation.score >= 5 ? "text-amber-400" : "text-red-400"
                      )} />
                      <span className={cn("font-bold text-sm",
                        evaluation.score >= 8 ? "text-emerald-400" : evaluation.score >= 5 ? "text-amber-400" : "text-red-400"
                      )}>
                        {evaluation.score} / {currentScene.maxScore} Punkte
                      </span>
                    </div>
                    {evaluation.matchedTerms.length > 0 && (
                      <div className="mt-2">
                        <p className="text-white/40 text-xs mb-1">Erkannte Schlüsselbegriffe:</p>
                        <div className="flex flex-wrap gap-1">
                          {evaluation.matchedTerms.map((term) => (
                            <span key={term} className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">{term}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Optimal Actions */}
                  <div className="bg-white/5 rounded-xl border border-white/10 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Optimale Vorgehensweise</span>
                    </div>
                    <ul className="space-y-2">
                      {currentScene.optimalActions.map((action, i) => {
                        const isMissed = evaluation.missedActions.includes(action);
                        return (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle2 className={cn("w-3.5 h-3.5 mt-0.5 flex-shrink-0", isMissed ? "text-white/20" : "text-emerald-400")} />
                            <span className={cn("text-xs leading-relaxed", isMissed ? "text-white/40" : "text-white/70")}>{action}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <button
                    onClick={handleNext}
                    className={cn(
                      "w-full py-3 rounded-xl font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99]",
                      currentSceneIndex >= scenes.length - 1
                        ? "bg-gradient-to-r from-amber-600 to-orange-600"
                        : "bg-gradient-to-r from-blue-600 to-cyan-600"
                    )}
                  >
                    {currentSceneIndex >= scenes.length - 1 ? "Ergebnis anzeigen" : "Weiter zur nächsten Phase"}
                    <ChevronRight className="w-4 h-4 inline ml-1 -mt-0.5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toggle */}
      <button
        onClick={() => setShowNarrative(!showNarrative)}
        className="absolute left-4 bottom-4 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 px-3 py-2 text-white/50 text-xs hover:text-white transition-colors z-10"
      >
        {showNarrative ? "Panel ausblenden" : "Panel einblenden"}
      </button>

      <div className="absolute right-4 bottom-4 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 px-3 py-2 z-10">
        <p className="text-white/30 text-xs">{participantName}</p>
      </div>
    </div>
  );
}

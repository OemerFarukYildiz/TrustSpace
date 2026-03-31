export interface SceneNode {
  id: number;
  title: string;
  narrative: string;
  illustration: string; // icon name: "shield-alert", "flame", "database", "server-crash"
  timeLimitSec: number | null;
  choices: Choice[];
  freeTextPrompt?: string;
}

export interface Choice {
  id: string;
  text: string;
  score: number;
  feedback: string;
  nextScene: number | "end";
  isOptimal: boolean;
}

export interface ScenarioMeta {
  totalScenes: number;
  maxPossibleScore: number;
  placeholders: string[];
}

export interface ParticipantChoice {
  sceneId: number;
  choiceId: string;
  freeText?: string;
  timeSpentSec: number;
}

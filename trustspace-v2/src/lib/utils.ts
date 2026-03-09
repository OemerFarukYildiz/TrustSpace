import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function getRiskColor(score: number): string {
  if (score >= 15) return "text-risk-critical bg-risk-critical/10";
  if (score >= 10) return "text-risk-high bg-risk-high/10";
  if (score >= 5) return "text-risk-medium bg-risk-medium/10";
  return "text-risk-low bg-risk-low/10";
}

export function getRiskLabel(score: number): string {
  if (score >= 15) return "Kritisch";
  if (score >= 10) return "Hoch";
  if (score >= 5) return "Mittel";
  return "Niedrig";
}

export function calculateRiskScore(probability: number, impact: number): number {
  return probability * impact;
}

// ============================================================
// V2 Risk Management Utilities
// ============================================================

export function getRiskLevelV2(score: number): { label: string; color: string } {
  if (score >= 70) return { label: "Kritisch", color: "text-red-700 bg-red-100" };
  if (score >= 50) return { label: "Hoch", color: "text-orange-700 bg-orange-100" };
  if (score >= 30) return { label: "Mittel", color: "text-yellow-700 bg-yellow-100" };
  if (score >= 10) return { label: "Niedrig", color: "text-green-700 bg-green-100" };
  return { label: "Minimal", color: "text-gray-600 bg-gray-100" };
}

export function formatEUR(amount: number | null | undefined): string {
  if (amount == null) return "-";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateALE(sle: number | null | undefined, aro: number | null | undefined): number | null {
  if (sle == null || aro == null) return null;
  return Math.round(sle * aro);
}

export function getRiskScoreV2(probability: number, impact: number): number {
  return probability * impact;
}

export function getV2MatrixColor(score: number): string {
  if (score >= 70) return "bg-red-500";
  if (score >= 50) return "bg-orange-500";
  if (score >= 30) return "bg-yellow-400";
  if (score >= 10) return "bg-green-400";
  return "bg-green-200";
}

export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)} Mio.`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(0)} Tsd.`;
  return num.toString();
}

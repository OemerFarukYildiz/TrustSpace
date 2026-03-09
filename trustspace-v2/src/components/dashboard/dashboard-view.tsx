"use client";

import { useState, useEffect } from "react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday, startOfYear, endOfYear } from "date-fns";
import { de } from "date-fns/locale";

// Chart Data
const donutData1 = [
  { name: "Aktiv", value: 38, color: "#22C55E" },
  { name: "Rest", value: 62, color: "#E5E7EB" },
];

const donutData2 = [
  { name: "Avoidance", value: 10, color: "#EF4444" },
  { name: "Acceptance", value: 45, color: "#22C55E" },
  { name: "Mitigation", value: 30, color: "#3B82F6" },
  { name: "Open", value: 15, color: "#F59E0B" },
];

const quarterlyData = [
  { quarter: "Q4 2024", Datenschutz: 1, InfoSec: 0, Events: 0, Schwachstelle: 0, Intern: 0, Extern: 1 },
  { quarter: "Q1 2025", Datenschutz: 0, InfoSec: 0, Events: 0, Schwachstelle: 0, Intern: 0, Extern: 0 },
  { quarter: "Q2 2025", Datenschutz: 0, InfoSec: 0, Events: 0, Schwachstelle: 0, Intern: 0, Extern: 0 },
  { quarter: "Q3 2025", Datenschutz: 1, InfoSec: 1, Events: 0, Schwachstelle: 0, Intern: 2, Extern: 0 },
  { quarter: "Q4 2025", Datenschutz: 1, InfoSec: 1, Events: 1, Schwachstelle: 0, Intern: 0, Extern: 1 },
  { quarter: "Q1 2026", Datenschutz: 0, InfoSec: 0, Events: 0, Schwachstelle: 0, Intern: 1, Extern: 0 },
];

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AuditOwner {
  id: string;
  employeeId: string;
  employee: Employee;
}

interface Audit {
  id: string;
  title: string;
  type: string;  // "Internal Audit", "External Audit", "Certification", "Review"
  plannedDate: string;  // ISO date string from API
  status: "open" | "close";
  description?: string;
  owners: AuditOwner[];
}

export function DashboardView() {
  const router = useRouter();
  // Audits State - loaded from API
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);

  // Load audits from API
  useEffect(() => {
    async function loadAudits() {
      try {
        const res = await fetch("/api/audits");
        if (res.ok) {
          const data = await res.json();
          setAudits(data);
        }
      } catch (error) {
        console.error("Failed to load audits:", error);
      } finally {
        setLoading(false);
      }
    }
    loadAudits();
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Kalender-Navigation
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Kalender-Tage generieren
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { locale: de });
  const calendarEnd = endOfWeek(monthEnd, { locale: de });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Audit hinzufügen
  const addAudit = (newAudit: Omit<Audit, "id">) => {
    setAudits([...audits, { ...newAudit, id: Date.now().toString() }]);
  };

  // Audits für einen bestimmten Tag
  const getAuditsForDay = (day: Date) => {
    return audits.filter(audit => isSameDay(new Date(audit.plannedDate), day));
  };

  // Audits im aktuellen Jahr (für Sidebar)
  const yearStart = startOfYear(new Date());
  const yearEnd = endOfYear(new Date());
  const upcomingAudits = audits
    .filter(a => {
      const d = new Date(a.plannedDate);
      return d >= yearStart && d <= yearEnd;
    })
    .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime());

  // Nächstes zukünftiges Audit für Header-Countdown
  const nextFutureAudit = audits
    .filter(a => new Date(a.plannedDate) >= new Date() && a.status === "open")
    .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())[0] || null;

  const daysToNextAudit = nextFutureAudit
    ? Math.ceil((new Date(nextFutureAudit.plannedDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Kompakte Kalender-Ansicht (nur aktueller Monat, klein)
  const compactCalendarDays = eachDayOfInterval({
    start: startOfWeek(monthStart, { locale: de }),
    end: endOfWeek(monthEnd, { locale: de })
  });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {nextFutureAudit ? (
              <>
                Next audit: <span className="font-medium text-[#0066FF]">{nextFutureAudit.title}</span> in {daysToNextAudit} days
              </>
            ) : (
              "Welcome to your ISMS Dashboard"
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/audits">
            <Button variant="outline" className="gap-2">
              <CalendarIcon className="w-4 h-4" />
              View Audits
            </Button>
          </Link>
          <AddAuditDialog />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          title="Guideline Adoption"
          value="98%"
          description="Policies accepted by employees"
          data={[{ value: 98, color: "#22C55E" }, { value: 2, color: "#E5E7EB" }]}
          icon="📋"
        />
        <KpiCard
          title="Active Guidelines"
          value="84%"
          description="Currently active security policies"
          data={[{ value: 84, color: "#3B82F6" }, { value: 16, color: "#E5E7EB" }]}
          icon="📄"
        />
        <KpiCard
          title="Vendor Assessments"
          value="100%"
          description="All vendor questionnaires done"
          data={[{ value: 100, color: "#8B5CF6" }, { value: 0, color: "#E5E7EB" }]}
          icon="✓"
        />
      </div>

      {/* Middle Section - Charts */}
      <div className="grid grid-cols-3 gap-4">
        {/* SoA Chart */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-6">SoA Implementation Ratio</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData1}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    {donutData1.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-center -mt-32 mb-8">
              <span className="text-4xl font-semibold text-gray-900">38%</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500"></span>
                <span className="text-gray-600">Active Applicable SoAs</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-gray-300"></span>
                <span className="text-gray-600">Non Active Applicable SoAs</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Risk Treatment Chart */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-6">Risk Treatment Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData2}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {donutData2.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs mt-4">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-gray-600">Avoidance</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                <span className="text-gray-600">Acceptance</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-gray-600">Mitigation</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-gray-600">Open</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quarterly Chart + Compact Calendar */}
        <div className="space-y-4">
          {/* Quarterly Chart */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Quarterly Incident Intake</h3>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quarterlyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="Datenschutz" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="InfoSec" stackId="a" fill="#1E40AF" />
                    <Bar dataKey="Events" stackId="a" fill="#60A5FA" />
                    <Bar dataKey="Extern" stackId="a" fill="#A855F7" />
                    <Bar dataKey="Intern" stackId="a" fill="#86EFAC" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Compact Calendar Widget */}
          <Card className="cursor-pointer hover:shadow-lg transition-all border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 overflow-hidden" onClick={() => setCalendarOpen(true)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  Audit Calendar
                </h3>
                <Maximize2 className="w-4 h-4 text-gray-400" />
              </div>
              
              {/* Mini Calendar */}
              <div className="text-center mb-3">
                <span className="text-sm font-medium text-gray-700">
                  {format(currentDate, "MMMM yyyy", { locale: de })}
                </span>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 mb-2">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <div key={i} className="font-medium">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {compactCalendarDays.slice(0, 28).map((day, i) => {
                  const dayAudits = getAuditsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);
                  
                  return (
                    <div
                      key={i}
                      className={`aspect-square flex items-center justify-center text-[10px] rounded-md ${
                        isTodayDate ? "bg-[#0066FF] text-white font-medium" : 
                        dayAudits.length > 0 ? "bg-blue-50 text-blue-700 font-medium border border-blue-100" :
                        !isCurrentMonth ? "text-gray-300" : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {format(day, "d")}
                    </div>
                  );
                })}
              </div>
              
              {/* Upcoming Audit Preview */}
              {nextFutureAudit && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <p className="text-xs text-gray-500">Nächster Audit</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 truncate ml-4">{nextFutureAudit.title}</p>
                  <p className="text-xs text-gray-400 ml-4">{format(new Date(nextFutureAudit.plannedDate), "dd. MMMM yyyy", { locale: de })}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-6">Guideline Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterlyData.slice(0, 4)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="quarter" type="category" tick={{ fontSize: 10 }} width={60} />
                  <Tooltip />
                  <Bar dataKey="Datenschutz" stackId="a" fill="#F59E0B" />
                  <Bar dataKey="InfoSec" stackId="a" fill="#1E40AF" />
                  <Bar dataKey="Events" stackId="a" fill="#60A5FA" />
                  <Bar dataKey="Extern" stackId="a" fill="#A855F7" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-900 mb-6">Incident Status Distribution</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="Intern" fill="#86EFAC" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Full Calendar Dialog with Sidebar */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="sm:max-w-[1000px] p-0 overflow-hidden rounded-2xl">
          <div className="grid grid-cols-3 h-[600px]">
            {/* Left: Calendar */}
            <div className="col-span-2 p-6 bg-white">
              <DialogHeader className="mb-6">
                <DialogTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                      <CalendarIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-lg font-semibold">Audit Calendar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="rounded-lg" onClick={prevMonth}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium min-w-[140px] text-center">
                      {format(currentDate, "MMMM yyyy", { locale: de })}
                    </span>
                    <Button variant="outline" size="icon" className="rounded-lg" onClick={nextMonth}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              {/* Wochentage */}
              <div className="grid grid-cols-7 gap-1 mb-3">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="text-center text-xs font-semibold text-gray-400 py-2 uppercase tracking-wider">
                    {day}
                  </div>
                ))}
              </div>

              {/* Kalender-Tage */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  const dayAudits = getAuditsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isTodayDate = isToday(day);

                  return (
                    <div
                      key={index}
                      className={`min-h-[70px] p-2 border rounded-xl transition-all hover:shadow-md ${
                        isCurrentMonth ? "bg-white" : "bg-gray-50/50"
                      } ${isTodayDate ? "border-[#0066FF] border-2 ring-2 ring-blue-100" : "border-gray-100"}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isTodayDate ? "text-[#0066FF]" : isCurrentMonth ? "text-gray-700" : "text-gray-400"
                      }`}>
                        {format(day, "d")}
                      </div>
                      <div className="space-y-1">
                        {dayAudits.map((audit) => (
                          <button
                            key={audit.id}
                            onClick={() => { setCalendarOpen(false); router.push(`/audits/${audit.id}`); }}
                            className={`w-full text-left text-[10px] px-2 py-1 rounded-md truncate font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                              audit.type === "Internal Audit" ? "bg-blue-100 text-blue-700" :
                              audit.type === "External Audit" ? "bg-purple-100 text-purple-700" :
                              audit.type === "Certification" ? "bg-green-100 text-green-700" :
                              "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {audit.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legende */}
              <div className="flex gap-4 mt-4 text-xs flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></span>
                  <span className="text-gray-600">Internal Audit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-purple-100 border border-purple-200"></span>
                  <span className="text-gray-600">External Audit</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-green-100 border border-green-200"></span>
                  <span className="text-gray-600">Certification</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-gray-100 border border-gray-200"></span>
                  <span className="text-gray-600">Review</span>
                </div>
              </div>
            </div>

            {/* Right: Upcoming Audits Sidebar */}
            <div className="col-span-1 bg-gradient-to-b from-gray-50 to-gray-100 border-l border-gray-200 p-6 flex flex-col">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-blue-600" />
                </div>
                Upcoming Audits
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-3">
                {upcomingAudits.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Keine Audits in {new Date().getFullYear()}
                  </p>
                ) : (
                  upcomingAudits.map((audit) => {
                    const isPast = new Date(audit.plannedDate) < new Date();
                    return (
                      <button
                        key={audit.id}
                        onClick={() => { setCalendarOpen(false); router.push(`/audits/${audit.id}`); }}
                        className={`w-full text-left p-3 bg-white rounded-lg border hover:shadow-md transition-shadow cursor-pointer ${isPast ? "border-gray-100 opacity-60" : "border-gray-200"}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm text-gray-900">{audit.title}</p>
                          {isPast && <span className="text-[10px] text-gray-400 shrink-0">vergangen</span>}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(audit.plannedDate), "dd. MMMM yyyy", { locale: de })}
                        </p>
                        <Badge
                          className={`mt-2 text-xs ${
                            audit.type === "Internal Audit" ? "bg-blue-100 text-blue-700 border-blue-200" :
                            audit.type === "External Audit" ? "bg-purple-100 text-purple-700 border-purple-200" :
                            audit.type === "Certification" ? "bg-green-100 text-green-700 border-green-200" :
                            "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                          variant="outline"
                        >
                          {audit.type}
                        </Badge>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link href="/audits" onClick={() => setCalendarOpen(false)}>
                  <Button className="w-full bg-[#0066FF] hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Audit
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  description: string;
  data: { value: number; color: string }[];
  icon?: string;
}

function KpiCard({ title, value, description, data, icon }: KpiCardProps) {
  const chartData = [
    { name: "value", value: data[0].value },
    { name: "rest", value: data[1].value },
  ];

  return (
    <Card className="hover:shadow-lg transition-shadow border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <div className="w-12 h-12">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={14}
                    outerRadius={22}
                    startAngle={90}
                    endAngle={-270}
                    dataKey="value"
                  >
                    <Cell fill={data[0].color} />
                    <Cell fill={data[1].color} />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddAuditDialog({ onAdd, compact = false }: { onAdd?: (audit: Omit<Audit, "id">) => void; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "Internal Audit" as "Internal Audit" | "External Audit" | "Certification" | "Review",
    date: format(new Date(), "yyyy-MM-dd"),
    status: "open" as "open" | "close",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch("/api/audits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          type: formData.type,
          plannedDate: formData.date,
          description: formData.description,
          status: formData.status,
          ownerIds: [],
          documents: [],
        }),
      });

      if (res.ok) {
        setOpen(false);
        setFormData({
          title: "",
          type: "Internal Audit",
          date: format(new Date(), "yyyy-MM-dd"),
          status: "open",
          description: "",
        });
        // Reload page to show new audit
        window.location.reload();
      }
    } catch (error) {
      console.error("Failed to create audit:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0066FF] hover:bg-blue-700" size={compact ? "sm" : "default"}>
          <Plus className="w-4 h-4 mr-2" />
          {compact ? "Add Audit" : "Set New Date"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule New Audit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g. Internal ISO 27001 Audit"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select 
                value={formData.type}
                onValueChange={(v: "Internal Audit" | "External Audit" | "Certification" | "Review") => setFormData({...formData, type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Internal Audit">Internal Audit</SelectItem>
                  <SelectItem value="External Audit">External Audit</SelectItem>
                  <SelectItem value="Certification">Certification</SelectItem>
                  <SelectItem value="Review">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status}
                onValueChange={(v: "open" | "close") => setFormData({...formData, status: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="close">Close</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="date">Date</Label>
            <Input 
              id="date" 
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input 
              id="description" 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-[#0066FF] hover:bg-blue-700" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

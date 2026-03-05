import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, Plus, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

async function getFindings() {
  const orgId = "default-org";
  const findings = await prisma.finding.findMany({
    where: { organizationId: orgId },
    include: { assignee: true, risk: true, control: true, audit: true },
    orderBy: { createdAt: "desc" },
  });
  return findings;
}

export default async function FindingsPage() {
  const findings = await getFindings();

  const openCount = findings.filter((f) => f.status === "open").length;
  const inProgressCount = findings.filter((f) => f.status === "in_progress").length;
  const closedCount = findings.filter((f) => f.status === "closed").length;
  const totalCount = findings.length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-blue-600 bg-blue-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle className="w-4 h-4" />;
      case "in_progress":
        return <Clock className="w-4 h-4" />;
      case "closed":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Maßnahmen</h1>
          <p className="text-muted-foreground mt-1">
            Findings, Aufgaben und Verbesserungen
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Maßnahme erstellen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Offen</p>
                <p className="text-3xl font-bold text-red-600">{openCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Bearbeitung</p>
                <p className="text-3xl font-bold text-yellow-600">{inProgressCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Abgeschlossen</p>
                <p className="text-3xl font-bold text-green-600">{closedCount}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-3xl font-bold">{totalCount}</p>
              </div>
              <ClipboardCheck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Findings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Maßnahmen-Übersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Titel</th>
                  <th className="text-left py-3 px-4 font-medium">Typ</th>
                  <th className="text-center py-3 px-4 font-medium">Priorität</th>
                  <th className="text-center py-3 px-4 font-medium">Status</th>
                  <th className="text-center py-3 px-4 font-medium">Fällig</th>
                  <th className="text-center py-3 px-4 font-medium">Zugewiesen</th>
                </tr>
              </thead>
              <tbody>
                {findings.map((finding) => (
                  <tr key={finding.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <p className="font-medium">{finding.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {finding.description || "-"}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">
                        {finding.type === "audit_finding"
                          ? "Audit-Finding"
                          : finding.type === "incident"
                          ? "Vorfall"
                          : finding.type === "improvement"
                          ? "Verbesserung"
                          : "Aufgabe"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className={getPriorityColor(finding.priority)}>
                        {finding.priority === "critical"
                          ? "Kritisch"
                          : finding.priority === "high"
                          ? "Hoch"
                          : finding.priority === "medium"
                          ? "Mittel"
                          : "Niedrig"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getStatusIcon(finding.status)}
                        <span className="text-sm">
                          {finding.status === "open"
                            ? "Offen"
                            : finding.status === "in_progress"
                            ? "In Bearbeitung"
                            : finding.status === "review"
                            ? "In Review"
                            : "Abgeschlossen"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {finding.dueDate ? (
                        <span className="text-sm">{formatDate(finding.dueDate)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {finding.assignee ? (
                        <span className="text-sm">
                          {finding.assignee.firstName} {finding.assignee.lastName}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

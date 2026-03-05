import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Sparkles, FileDown, CheckCircle } from "lucide-react";

async function getControls() {
  const orgId = "default-org";
  const controls = await prisma.control.findMany({
    where: { organizationId: orgId },
    include: { responsible: true },
    orderBy: { code: "asc" },
  });
  return controls;
}

export default async function SoaPage() {
  const controls = await getControls();

  const totalControls = controls.length;
  const applicableCount = controls.filter((c) => c.isApplicable).length;
  const withJustificationCount = controls.filter((c) => c.justification).length;
  const categoriesCount = new Set(controls.map((c) => c.code.split(".")[1])).size;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SOA - Statement of Applicability</h1>
          <p className="text-muted-foreground mt-1">
            ISO 27001 Kontrollen und deren Anwendbarkeit
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileDown className="w-4 h-4 mr-2" />
            Exportieren
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-3xl font-bold">{totalControls}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Anwendbar</p>
                <p className="text-3xl font-bold text-green-600">{applicableCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Mit Begründung</p>
                <p className="text-3xl font-bold">{withJustificationCount}</p>
              </div>
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Kategorien</p>
                <p className="text-3xl font-bold">{categoriesCount}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kontrollen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Code</th>
                  <th className="text-left py-3 px-4 font-medium">Titel</th>
                  <th className="text-left py-3 px-4 font-medium">Beschreibung</th>
                  <th className="text-center py-3 px-4 font-medium">Anwendbar</th>
                  <th className="text-center py-3 px-4 font-medium">Verantwortlich</th>
                </tr>
              </thead>
              <tbody>
                {controls.map((control) => (
                  <tr key={control.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <Badge variant="outline">{control.code}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{control.title}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {control.description || "-"}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant={control.isApplicable ? "default" : "secondary"}>
                        {control.isApplicable ? "Ja" : "Nein"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {control.responsible ? (
                        <span className="text-sm">
                          {control.responsible.firstName} {control.responsible.lastName}
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

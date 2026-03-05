import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Store, Plus, Globe, Shield } from "lucide-react";

async function getVendors() {
  const orgId = "default-org";
  const vendors = await prisma.vendor.findMany({
    where: { organizationId: orgId },
    orderBy: { name: "asc" },
  });
  return vendors;
}

export default async function VendorsPage() {
  const vendors = await getVendors();

  const totalVendors = vendors.length;
  const approvedCount = vendors.filter((v) => v.assessmentStatus === "approved").length;
  const gdprCompliantCount = vendors.filter((v) => v.gdprCompliant).length;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vendoren</h1>
          <p className="text-muted-foreground mt-1">
            Drittanbieter und deren Bewertung
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Vendor hinzufügen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Gesamt</p>
                <p className="text-3xl font-bold">{totalVendors}</p>
              </div>
              <Store className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Freigegeben</p>
                <p className="text-3xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <Shield className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">DSGVO-konform</p>
                <p className="text-3xl font-bold">{gdprCompliantCount}</p>
              </div>
              <Globe className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vendor Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <Card key={vendor.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-lg">{vendor.name}</p>
                  <p className="text-sm text-muted-foreground">{vendor.category}</p>
                </div>
                <Badge
                  variant={
                    vendor.assessmentStatus === "approved"
                      ? "default"
                      : vendor.assessmentStatus === "evaluated"
                      ? "secondary"
                      : "outline"
                  }
                >
                  {vendor.assessmentStatus === "approved"
                    ? "Freigegeben"
                    : vendor.assessmentStatus === "evaluated"
                    ? "Bewertet"
                    : vendor.assessmentStatus === "sent"
                    ? "Versendet"
                    : "Nicht bewertet"}
                </Badge>
              </div>

              {vendor.services && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {vendor.services}
                </p>
              )}

              <div className="mt-4 flex items-center gap-4">
                {vendor.gdprCompliant ? (
                  <Badge variant="outline" className="text-green-600">
                    DSGVO-konform
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-red-600">
                    DSGVO offen
                  </Badge>
                )}
                {vendor.trustCenterUrl && (
                  <a
                    href={vendor.trustCenterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Trust Center
                  </a>
                )}
              </div>

              {vendor.certifications && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground">
                    Zertifizierungen: {vendor.certifications}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

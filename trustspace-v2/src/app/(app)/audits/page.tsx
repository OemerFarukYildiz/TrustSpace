"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ChevronRight, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

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
  plannedDate: string;
  actualDate?: string;
  type: string;
  status: "open" | "close";
  description?: string;
  documents?: string;
  owners: AuditOwner[];
}

const years = [2025, 2026, 2027, 2028];

export default function AuditsPage() {
  const router = useRouter();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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

  // Group audits by year
  const auditsByYear = years.reduce((acc, year) => {
    acc[year] = audits.filter(a => new Date(a.plannedDate).getFullYear() === year);
    return acc;
  }, {} as Record<number, Audit[]>);

  // Filter audits for selected year
  const currentAudits = selectedYear 
    ? auditsByYear[selectedYear].filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Upcoming audits (max 5)
  const upcomingAudits = audits
    .filter(a => a.status === "open" && new Date(a.plannedDate) >= new Date())
    .sort((a, b) => new Date(a.plannedDate).getTime() - new Date(b.plannedDate).getTime())
    .slice(0, 5);

  const getStatusColor = (status: string) => {
    return status === "open" 
      ? "bg-green-100 text-green-700 border-green-200" 
      : "bg-gray-100 text-gray-600 border-gray-200";
  };

  const getEmployeeInitials = (emp: Employee) => {
    return `${emp.firstName.charAt(0)}${emp.lastName.charAt(0)}`.toUpperCase();
  };

  // Year Overview Cards
  if (!selectedYear) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Audits</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage and track all your ISMS audits
            </p>
          </div>
          <Button 
            className="bg-[#0066FF] hover:bg-blue-700"
            onClick={() => router.push("/audits/new?year=" + new Date().getFullYear())}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>

        {/* Year Cards */}
        <div className="grid grid-cols-4 gap-4">
          {years.map((year) => (
            <Card 
              key={year} 
              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setSelectedYear(year)}
            >
              {/* Image Header */}
              <div 
                className="h-32 bg-gradient-to-br from-blue-400 to-blue-600 relative"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{year}</span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-blue-600/50 to-transparent"></div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900">Audit {year}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {auditsByYear[year]?.length || 0} Audits
                </p>
                {auditsByYear[year]?.filter(a => a.status === "open").length > 0 && (
                  <Badge className="mt-2 bg-orange-100 text-orange-700">
                    {auditsByYear[year].filter(a => a.status === "open").length} Open
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Audit List for Selected Year
  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => setSelectedYear(null)}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          Audits
        </button>
        <ChevronRight className="w-4 h-4 text-gray-400" />
        <span className="text-sm font-medium">{selectedYear}</span>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">
          Audits {selectedYear}
        </h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search Audit" 
              className="pl-9 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            className="bg-[#0066FF] hover:bg-blue-700"
            onClick={() => router.push(`/audits/new?year=${selectedYear}`)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New
          </Button>
        </div>
      </div>

      {/* Audit Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Title</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Planned Date</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Owners</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {currentAudits.map((audit) => (
                <tr 
                  key={audit.id} 
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/audits/${audit.id}`)}
                >
                  <td className="py-4 px-4">
                    <span className="font-medium text-gray-900">{audit.title}</span>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {format(new Date(audit.plannedDate), "d MMMM yyyy")}
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant="outline">{audit.type}</Badge>
                  </td>
                  <td className="py-4 px-4">
                    <Badge className={getStatusColor(audit.status)} variant="outline">
                      {audit.status}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex -space-x-2">
                      {audit.owners.slice(0, 3).map((owner) => (
                        <div 
                          key={owner.id}
                          className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs border-2 border-white"
                          title={`${owner.employee.firstName} ${owner.employee.lastName}`}
                        >
                          {getEmployeeInitials(owner.employee)}
                        </div>
                      ))}
                      {audit.owners.length > 3 && (
                        <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs border-2 border-white">
                          +{audit.owners.length - 3}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <button className="p-2 hover:bg-gray-200 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
              {currentAudits.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    No audits found for {selectedYear}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

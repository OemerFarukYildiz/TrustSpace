"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Mail, Phone, Building, MoreVertical } from "lucide-react";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  department: string;
  role: string;
  position: string;
  status: "aktiv" | "inaktiv";
  avatar?: string;
}

const initialEmployees: Employee[] = [
  {
    id: "1",
    firstName: "Omer Faruk",
    lastName: "Yildiz",
    email: "o.yildiz@trustspace.de",
    phone: "+49 170 1234567",
    department: "IT",
    role: "ISB",
    position: "Informationssicherheitsbeauftragter",
    status: "aktiv",
  },
  {
    id: "2",
    firstName: "Stefania",
    lastName: "Vetere",
    email: "s.vetere@trustspace.de",
    phone: "+49 170 7654321",
    department: "IT",
    role: "Admin",
    position: "System Administrator",
    status: "aktiv",
  },
  {
    id: "3",
    firstName: "Max",
    lastName: "Mustermann",
    email: "m.mustermann@trustspace.de",
    department: "HR",
    role: "Mitarbeiter",
    position: "HR Manager",
    status: "aktiv",
  },
];

const departments = ["IT", "HR", "Finance", "Legal", "Operations", "Marketing"];
const roles = ["ISB", "Admin", "QM", "Stellvertreter", "Mitarbeiter"];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = useState("");

  const addEmployee = (newEmployee: Omit<Employee, "id">) => {
    setEmployees([...employees, { ...newEmployee, id: Date.now().toString() }]);
  };

  const filteredEmployees = employees.filter(e => 
    e.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Mitarbeiter</h1>
          <p className="text-sm text-gray-500 mt-1">
            Verwalten Sie alle Mitarbeiter und deren ISMS-Rollen
          </p>
        </div>
        <AddEmployeeDialog onAdd={addEmployee} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Gesamt</p>
            <p className="text-2xl font-semibold">{employees.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Aktiv</p>
            <p className="text-2xl font-semibold text-green-600">
              {employees.filter(e => e.status === "aktiv").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">ISB / Rollen</p>
            <p className="text-2xl font-semibold">
              {employees.filter(e => e.role === "ISB" || e.role === "Stellvertreter").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Abteilungen</p>
            <p className="text-2xl font-semibold">
              {new Set(employees.map(e => e.department)).size}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Mitarbeiter suchen..." 
            className="pl-9 w-80"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Mitarbeiter</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Kontakt</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Abteilung</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Rolle</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr 
                  key={employee.id} 
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0066FF] text-white flex items-center justify-center font-medium">
                        {getInitials(employee.firstName, employee.lastName)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</p>
                        <p className="text-sm text-gray-500">{employee.position}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        {employee.email}
                      </div>
                      {employee.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4" />
                          {employee.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{employee.department}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <Badge variant={employee.role === "ISB" ? "default" : "secondary"}>
                      {employee.role}
                    </Badge>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.status === "aktiv" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {employee.status === "aktiv" ? "Aktiv" : "Inaktiv"}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <button className="p-2 hover:bg-gray-200 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function AddEmployeeDialog({ onAdd }: { onAdd: (employee: Omit<Employee, "id">) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "IT",
    role: "Mitarbeiter",
    position: "",
    status: "aktiv" as "aktiv" | "inaktiv",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setOpen(false);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      department: "IT",
      role: "Mitarbeiter",
      position: "",
      status: "aktiv",
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0066FF] hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Mitarbeiter hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neuen Mitarbeiter hinzufügen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">Vorname</Label>
              <Input 
                id="firstName" 
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Nachname</Label>
              <Input 
                id="lastName" 
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="email">E-Mail</Label>
            <Input 
              id="email" 
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone">Telefon</Label>
            <Input 
              id="phone" 
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div>
            <Label htmlFor="position">Position</Label>
            <Input 
              id="position" 
              value={formData.position}
              onChange={(e) => setFormData({...formData, position: e.target.value})}
              placeholder="z.B. HR Manager"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Abteilung</Label>
              <Select 
                value={formData.department}
                onValueChange={(v) => setFormData({...formData, department: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ISMS-Rolle</Label>
              <Select 
                value={formData.role}
                onValueChange={(v) => setFormData({...formData, role: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit" className="bg-[#0066FF] hover:bg-blue-700">
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

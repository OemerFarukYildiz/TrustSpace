"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Plus, Calendar, Users, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface Training {
  id: string;
  title: string;
  description: string;
  type: "obligatorisch" | "freiwillig";
  status: "geplant" | "aktiv" | "abgeschlossen";
  startDate: string;
  endDate: string;
  participants: number;
  completed: number;
  assignedTo: string[];
}

const initialTrainings: Training[] = [
  {
    id: "1",
    title: "ISO 27001 Grundlagen",
    description: "Einführung in die Informationssicherheit und ISO 27001",
    type: "obligatorisch",
    status: "aktiv",
    startDate: "01.03.2025",
    endDate: "31.03.2025",
    participants: 25,
    completed: 18,
    assignedTo: ["Alle Mitarbeiter"],
  },
  {
    id: "2",
    title: "Phishing Awareness",
    description: "Erkennen und Verhindern von Phishing-Angriffen",
    type: "obligatorisch",
    status: "aktiv",
    startDate: "15.03.2025",
    endDate: "30.04.2025",
    participants: 25,
    completed: 12,
    assignedTo: ["Alle Mitarbeiter"],
  },
  {
    id: "3",
    title: "DSGVO Schulung",
    description: "Datenschutz-Grundverordnung für Mitarbeiter",
    type: "obligatorisch",
    status: "abgeschlossen",
    startDate: "01.01.2025",
    endDate: "28.02.2025",
    participants: 25,
    completed: 25,
    assignedTo: ["Alle Mitarbeiter"],
  },
];

export default function TrainingPage() {
  const [trainings, setTrainings] = useState<Training[]>(initialTrainings);
  const [searchQuery, setSearchQuery] = useState("");

  const addTraining = (newTraining: Omit<Training, "id" | "participants" | "completed">) => {
    setTrainings([...trainings, { 
      ...newTraining, 
      id: Date.now().toString(),
      participants: 0,
      completed: 0,
    }]);
  };

  const filteredTrainings = trainings.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "aktiv": return "bg-green-100 text-green-700";
      case "geplant": return "bg-blue-100 text-blue-700";
      case "abgeschlossen": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeColor = (type: string) => {
    return type === "obligatorisch" 
      ? "bg-red-100 text-red-700 border-red-200" 
      : "bg-green-100 text-green-700 border-green-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Training</h1>
          <p className="text-sm text-gray-500 mt-1">
            Schulungen und Awareness-Programme für Informationssicherheit
          </p>
        </div>
        <AddTrainingDialog onAdd={addTraining} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Aktive Schulungen</p>
            <p className="text-2xl font-semibold text-green-600">
              {trainings.filter(t => t.status === "aktiv").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Geplant</p>
            <p className="text-2xl font-semibold text-blue-600">
              {trainings.filter(t => t.status === "geplant").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Abgeschlossen</p>
            <p className="text-2xl font-semibold">
              {trainings.filter(t => t.status === "abgeschlossen").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Gesamtfortschritt</p>
            <p className="text-2xl font-semibold">
              {Math.round(
                trainings.reduce((acc, t) => acc + (t.completed / Math.max(t.participants, 1)), 0) / 
                trainings.length * 100
              )}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Schulung suchen..." 
            className="pl-9 w-80"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Training Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTrainings.map((training) => (
          <Card key={training.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{training.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{training.description}</p>
                </div>
                <Badge className={getTypeColor(training.type)} variant="outline">
                  {training.type === "obligatorisch" ? "Obligatorisch" : "Freiwillig"}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {training.startDate} - {training.endDate}
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {training.participants} Teilnehmer
                </div>
              </div>

              {training.status !== "geplant" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Fortschritt</span>
                    <span className="font-medium">
                      {training.completed} / {training.participants}
                    </span>
                  </div>
                  <Progress 
                    value={(training.completed / Math.max(training.participants, 1)) * 100} 
                    className="h-2"
                  />
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(training.status)}`}>
                  {training.status === "aktiv" && <Clock className="w-3 h-3" />}
                  {training.status === "abgeschlossen" && <CheckCircle2 className="w-3 h-3" />}
                  {training.status === "geplant" && <AlertCircle className="w-3 h-3" />}
                  {training.status.charAt(0).toUpperCase() + training.status.slice(1)}
                </span>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddTrainingDialog({ onAdd }: { onAdd: (training: Omit<Training, "id" | "participants" | "completed">) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "obligatorisch" as "obligatorisch" | "freiwillig",
    status: "geplant" as "geplant" | "aktiv" | "abgeschlossen",
    startDate: "",
    endDate: "",
    assignedTo: ["Alle Mitarbeiter"],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd(formData);
    setOpen(false);
    setFormData({
      title: "",
      description: "",
      type: "obligatorisch",
      status: "geplant",
      startDate: "",
      endDate: "",
      assignedTo: ["Alle Mitarbeiter"],
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[#0066FF] hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Schulung erstellen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Neue Schulung erstellen</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Titel</Label>
            <Input 
              id="title" 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="z.B. ISO 27001 Grundlagen"
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Input 
              id="description" 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Kurze Beschreibung der Schulung"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Typ</Label>
              <Select 
                value={formData.type}
                onValueChange={(v: "obligatorisch" | "freiwillig") => setFormData({...formData, type: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="obligatorisch">Obligatorisch</SelectItem>
                  <SelectItem value="freiwillig">Freiwillig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select 
                value={formData.status}
                onValueChange={(v: "geplant" | "aktiv" | "abgeschlossen") => setFormData({...formData, status: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geplant">Geplant</SelectItem>
                  <SelectItem value="aktiv">Aktiv</SelectItem>
                  <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Startdatum</Label>
              <Input 
                id="startDate" 
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                placeholder="TT.MM.JJJJ"
              />
            </div>
            <div>
              <Label htmlFor="endDate">Enddatum</Label>
              <Input 
                id="endDate" 
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                placeholder="TT.MM.JJJJ"
              />
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

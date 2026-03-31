"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const templates: Record<string, { title: string; html: string }> = {
  orgCtx: {
    title: "Organisation Kontext",
    html: `<h1>Organisation Kontext</h1><p>Hier Informationen eintragen...</p>`,
  },
  soa: {
    title: "SOA Export",
    html: `<h1>SOA Export</h1><p>Kontrolle | Anwendbarkeit | Begründung</p>`,
  },
  auditProgram: {
    title: "Auditprogramm",
    html: `<h1>Auditprogramm</h1><p>Audit | Datum | Verantwortlich</p>`,
  },
  userAccess: {
    title: "User Access Review",
    html: `<h1>User Access Review</h1><p>Benutzer | Rolle | Letzte Überprüfung</p>`,
  },
};

export default function TemplatePage() {
  const params = useParams();
  const router = useRouter();
  const kind = params?.kind as string;
  const tpl = templates[kind];

  if (!tpl) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold">Vorlage nicht gefunden</h1>
        <Button className="mt-4" onClick={() => router.back()}>
          Zurück
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{tpl.title}</h1>
        <Button size="sm" variant="outline" onClick={() => router.back()}>
          Zurück
        </Button>
      </div>
      <div
        className="mt-4 prose max-w-none"
        dangerouslySetInnerHTML={{ __html: tpl.html }}
      />
    </div>
  );
}

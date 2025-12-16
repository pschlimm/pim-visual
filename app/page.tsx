"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRightLeft,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Factory,
  FileSpreadsheet,
  Layers,
  Link2,
  Pause,
  Play,
  Route,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Truck,
  Zap,
} from "lucide-react";

/**
 * PIS Dataflow Visualizer
 * Single-file client component intended for Next.js App Router (app/page.tsx)
 * TailwindCSS required
 */

// ---------- Types ----------

type DeptKey =
  | "Entwicklung"
  | "Einkauf"
  | "Logistik"
  | "Werk"
  | "Vertrieb"
  | "Qualität"
  | "Produktmanagement"
  | "Marketing"
  | "TechDoku"
  | "BI";

type NodeKey =
  | "PDM"
  | "SAP"
  | "SAP_Einkauf"
  | "SAP_Logistik"
  | "SAP_Werk"
  | "SAP_Vertrieb"
  | "SAP_Qualität"
  | "SAP_PM"
  | "QualityChecker"
  | "PIM"
  | "MarketingCloud"
  | "TechDocs"
  | "BI_Files"
  | "Shopify"
  | "TranslationLoop"
  | "Apollo"
  | "TecDocCAT"
  | "Amazon"
  | "Listings";

type PayloadType =
  | "Core"
  | "Price"
  | "Logistics"
  | "Plant"
  | "Sales"
  | "Quality"
  | "PM"
  | "DAM"
  | "Manual"
  | "Marketing"
  | "Fitment"
  | "Knowledge"
  | "Translation"
  | "ListingSheet";

type EdgeKey =
  | "PDM->SAP"
  | "SAP_Einkauf->QC"
  | "SAP_Logistik->QC"
  | "SAP_Werk->QC"
  | "SAP_Vertrieb->QC"
  | "SAP_Qualität->QC"
  | "SAP_PM->QC"
  | "QC->PIM"
  | "MarketingCloud->PIM"
  | "TechDocs->PIM"
  | "BI_Files->PIM"
  | "PIM->Shopify"
  | "Shopify->TranslationLoop"
  | "TranslationLoop->PIM"
  | "PIM->Listings"
  | "Listings->Amazon"
  | "PIM->Apollo"
  | "Apollo->TecDocCAT";

type Edge = {
  key: EdgeKey;
  from: NodeKey;
  to: NodeKey;
  label: string;
  payloads: PayloadType[];
  kind: "sync" | "async" | "manual";
};

type Node = {
  key: NodeKey;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  size: "sm" | "md" | "lg";
  group: "Upstream" | "SAP" | "Validation" | "PIM" | "Sources" | "Channels";
  pos: { x: number; y: number };
};

type Task = {
  id: string;
  dept: DeptKey;
  title: string;
  produces: PayloadType[];
  blocks: { node: NodeKey; layer: string }[];
  impact: string;
  done: boolean;
  due: "Heute" | "Diese Woche" | "Dieses Sprint";
};

type ScenarioKey =
  | "End-to-End Standard"
  | "Shopify Übersetzungs-Loop"
  | "Fahrzeugzuordnung → Apollo → TecDoc/CAT"
  | "Listingsheets für Handelspartner"
  | "Qualitäts-Gate (Fehlende Daten simulieren)";

type Vec2 = { x: number; y: number };

type FocusMode =
  | { kind: "off" }
  | { kind: "node"; node: NodeKey }
  | { kind: "edge"; edge: EdgeKey };

// ---------- Visual palette ----------

const deptColor: Record<DeptKey, string> = {
  Einkauf: "bg-zinc-800",
  Qualität: "bg-orange-500",
  Entwicklung: "bg-lime-500",
  Vertrieb: "bg-sky-500",
  Marketing: "bg-amber-700",
  Logistik: "bg-yellow-400",
  Werk: "bg-violet-600",
  Produktmanagement: "bg-red-600",
  TechDoku: "bg-emerald-500",
  BI: "bg-stone-700",
};

const payloadStyle: Record<PayloadType, { label: string; ring: string; fill: string }> = {
  Core: { label: "Core", ring: "ring-red-500/70", fill: "bg-red-500" },
  Price: { label: "Preise", ring: "ring-zinc-900/60", fill: "bg-zinc-800" },
  Logistics: { label: "Logistik", ring: "ring-yellow-500/70", fill: "bg-yellow-400" },
  Plant: { label: "Werk", ring: "ring-violet-500/70", fill: "bg-violet-600" },
  Sales: { label: "Vertrieb", ring: "ring-sky-400/70", fill: "bg-sky-500" },
  Quality: { label: "QS", ring: "ring-orange-500/70", fill: "bg-orange-500" },
  PM: { label: "PM", ring: "ring-red-700/70", fill: "bg-red-600" },
  DAM: { label: "DAM", ring: "ring-lime-500/70", fill: "bg-lime-500" },
  Manual: { label: "Manual", ring: "ring-emerald-500/70", fill: "bg-emerald-500" },
  Marketing: { label: "Marketing", ring: "ring-amber-700/70", fill: "bg-amber-700" },
  Fitment: { label: "Fitment", ring: "ring-fuchsia-500/70", fill: "bg-fuchsia-500" },
  Knowledge: { label: "Wissen", ring: "ring-indigo-500/70", fill: "bg-indigo-500" },
  Translation: { label: "Translation", ring: "ring-cyan-400/70", fill: "bg-cyan-500" },
  ListingSheet: { label: "Listing", ring: "ring-stone-500/70", fill: "bg-stone-700" },
};

// ---------- Model ----------

const nodes: Node[] = [
  {
    key: "PDM",
    title: "PDM Daten",
    subtitle: "Entwicklung / Stammdaten",
    icon: <Layers className="h-5 w-5" />,
    size: "md",
    group: "Upstream",
    pos: { x: 0.08, y: 0.22 },
  },
  {
    key: "SAP",
    title: "SAP",
    subtitle: "Stammdaten & Sichten",
    icon: <Route className="h-5 w-5" />,
    size: "lg",
    group: "SAP",
    pos: { x: 0.25, y: 0.22 },
  },
  {
    key: "SAP_Einkauf",
    title: "Einkaufsicht",
    subtitle: "Preise, Konditionen",
    icon: <ShoppingBag className="h-5 w-5" />,
    size: "sm",
    group: "SAP",
    pos: { x: 0.25, y: 0.4 },
  },
  {
    key: "SAP_Logistik",
    title: "Logistiksicht",
    subtitle: "Packschema, Versand",
    icon: <Truck className="h-5 w-5" />,
    size: "sm",
    group: "SAP",
    pos: { x: 0.25, y: 0.5 },
  },
  {
    key: "SAP_Werk",
    title: "Werkssicht",
    subtitle: "Netto-Maße, WEEE",
    icon: <Factory className="h-5 w-5" />,
    size: "sm",
    group: "SAP",
    pos: { x: 0.25, y: 0.6 },
  },
  {
    key: "SAP_Vertrieb",
    title: "Vertriebssicht",
    subtitle: "Texte, Details",
    icon: <Store className="h-5 w-5" />,
    size: "sm",
    group: "SAP",
    pos: { x: 0.25, y: 0.7 },
  },
  {
    key: "SAP_Qualität",
    title: "Qualitätssicht",
    subtitle: "QS-relevante Daten",
    icon: <BadgeCheck className="h-5 w-5" />,
    size: "sm",
    group: "SAP",
    pos: { x: 0.25, y: 0.8 },
  },
  {
    key: "SAP_PM",
    title: "Produktmanagement",
    subtitle: "Portfolio & Wissen",
    icon: <BookOpen className="h-5 w-5" />,
    size: "sm",
    group: "SAP",
    pos: { x: 0.25, y: 0.9 },
  },
  {
    key: "QualityChecker",
    title: "Quality Checker",
    subtitle: "Validiert & Gate",
    icon: <ShieldCheck className="h-5 w-5" />,
    size: "md",
    group: "Validation",
    pos: { x: 0.42, y: 0.33 },
  },
  {
    key: "PIM",
    title: "PIM",
    subtitle: "Single Source of Truth",
    icon: <Zap className="h-5 w-5" />,
    size: "lg",
    group: "PIM",
    pos: { x: 0.58, y: 0.38 },
  },
  {
    key: "MarketingCloud",
    title: "Marketing Cloud",
    subtitle: "DAM Assets",
    icon: <Layers className="h-5 w-5" />,
    size: "sm",
    group: "Sources",
    pos: { x: 0.55, y: 0.12 },
  },
  {
    key: "TechDocs",
    title: "Technische Doku",
    subtitle: "Anleitungen",
    icon: <ClipboardList className="h-5 w-5" />,
    size: "sm",
    group: "Sources",
    pos: { x: 0.68, y: 0.12 },
  },
  {
    key: "BI_Files",
    title: "BI Dateien",
    subtitle: "Listing Sheets",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    size: "sm",
    group: "Sources",
    pos: { x: 0.78, y: 0.12 },
  },
  {
    key: "Shopify",
    title: "Shopify",
    subtitle: "Shop + DAM",
    icon: <Store className="h-5 w-5" />,
    size: "md",
    group: "Channels",
    pos: { x: 0.86, y: 0.3 },
  },
  {
    key: "TranslationLoop",
    title: "DeepL / Transcy",
    subtitle: "Übersetzungs-Loop",
    icon: <ArrowRightLeft className="h-5 w-5" />,
    size: "sm",
    group: "Channels",
    pos: { x: 0.82, y: 0.42 },
  },
  {
    key: "Listings",
    title: "Listingsheets",
    subtitle: "OBI, Stahlgruber, ATU …",
    icon: <FileSpreadsheet className="h-5 w-5" />,
    size: "md",
    group: "Channels",
    pos: { x: 0.86, y: 0.55 },
  },
  {
    key: "Amazon",
    title: "Amazon",
    subtitle: "Marketplace",
    icon: <Store className="h-5 w-5" />,
    size: "sm",
    group: "Channels",
    pos: { x: 0.94, y: 0.66 },
  },
  {
    key: "Apollo",
    title: "Apollo",
    subtitle: "Fahrzeugzuordnung",
    icon: <Link2 className="h-5 w-5" />,
    size: "md",
    group: "Channels",
    pos: { x: 0.72, y: 0.7 },
  },
  {
    key: "TecDocCAT",
    title: "CAT / TecDoc",
    subtitle: "Werkstätten (Aftermarket)",
    icon: <Search className="h-5 w-5" />,
    size: "md",
    group: "Channels",
    pos: { x: 0.9, y: 0.82 },
  },
];

const edges: Edge[] = [
  { key: "PDM->SAP", from: "PDM", to: "SAP", label: "Import", payloads: ["Core"], kind: "sync" },
  { key: "SAP_Einkauf->QC", from: "SAP_Einkauf", to: "QualityChecker", label: "Preise", payloads: ["Price"], kind: "manual" },
  { key: "SAP_Logistik->QC", from: "SAP_Logistik", to: "QualityChecker", label: "Logistik", payloads: ["Logistics"], kind: "manual" },
  { key: "SAP_Werk->QC", from: "SAP_Werk", to: "QualityChecker", label: "Werk", payloads: ["Plant"], kind: "manual" },
  { key: "SAP_Vertrieb->QC", from: "SAP_Vertrieb", to: "QualityChecker", label: "Vertrieb", payloads: ["Sales"], kind: "manual" },
  { key: "SAP_Qualität->QC", from: "SAP_Qualität", to: "QualityChecker", label: "QS", payloads: ["Quality"], kind: "manual" },
  { key: "SAP_PM->QC", from: "SAP_PM", to: "QualityChecker", label: "PM", payloads: ["PM"], kind: "manual" },
  {
    key: "QC->PIM",
    from: "QualityChecker",
    to: "PIM",
    label: "Validated",
    payloads: ["Core", "Price", "Logistics", "Plant", "Sales", "Quality", "PM"],
    kind: "sync",
  },
  { key: "MarketingCloud->PIM", from: "MarketingCloud", to: "PIM", label: "DAM", payloads: ["DAM"], kind: "async" },
  { key: "TechDocs->PIM", from: "TechDocs", to: "PIM", label: "Manuals", payloads: ["Manual"], kind: "async" },
  { key: "BI_Files->PIM", from: "BI_Files", to: "PIM", label: "Sheets", payloads: ["ListingSheet"], kind: "async" },
  { key: "PIM->Shopify", from: "PIM", to: "Shopify", label: "Shop Feed", payloads: ["Core", "DAM", "Marketing", "Sales"], kind: "sync" },
  { key: "Shopify->TranslationLoop", from: "Shopify", to: "TranslationLoop", label: "Translate", payloads: ["Translation"], kind: "async" },
  { key: "TranslationLoop->PIM", from: "TranslationLoop", to: "PIM", label: "Backfeed", payloads: ["Translation"], kind: "async" },
  {
    key: "PIM->Listings",
    from: "PIM",
    to: "Listings",
    label: "Exports",
    payloads: ["ListingSheet", "Core", "Sales", "Marketing"],
    kind: "async",
  },
  { key: "Listings->Amazon", from: "Listings", to: "Amazon", label: "Push", payloads: ["Core", "Marketing"], kind: "async" },
  { key: "PIM->Apollo", from: "PIM", to: "Apollo", label: "Fitment", payloads: ["Fitment"], kind: "sync" },
  { key: "Apollo->TecDocCAT", from: "Apollo", to: "TecDocCAT", label: "TecDoc", payloads: ["Fitment"], kind: "async" },
];

// ---------- Tasks ----------

const baseTasks: Task[] = [
  {
    id: "t-core",
    dept: "Entwicklung",
    title: "PDM Stammdaten pflegen (Artikel, Varianten, Attribute)",
    produces: ["Core"],
    blocks: [{ node: "SAP", layer: "Stammdaten" }],
    impact: "Ohne Core-Daten stoppt der gesamte Fluss bereits vor SAP.",
    done: true,
    due: "Diese Woche",
  },
  {
    id: "t-einkauf",
    dept: "Einkauf",
    title: "Preise/Konditionen aktualisieren",
    produces: ["Price"],
    blocks: [{ node: "QualityChecker", layer: "Pricing" }],
    impact: "Ohne Preis-Daten: keine Listung, keine Bestellung, falsche Marge.",
    done: false,
    due: "Heute",
  },
  {
    id: "t-logistik",
    dept: "Logistik",
    title: "Packschema, Versanddaten, Gefahrgut/Handling",
    produces: ["Logistics"],
    blocks: [{ node: "QualityChecker", layer: "Logistics" }],
    impact: "Ohne Logistik-Daten: Fehlversand, hohe Retouren, Carrier-Reklamationen.",
    done: false,
    due: "Diese Woche",
  },
  {
    id: "t-werk",
    dept: "Werk",
    title: "Netto-Maße, Ersatzteile, WEEE/Compliance-Logik",
    produces: ["Plant"],
    blocks: [{ node: "QualityChecker", layer: "Plant & Compliance" }],
    impact: "Ohne Werkdaten: Compliance-Risiko, falsche Maße in Kanälen.",
    done: false,
    due: "Dieses Sprint",
  },
  {
    id: "t-vertrieb",
    dept: "Vertrieb",
    title: "Vertriebstexte, radschienenabstand/Technik-Details ergänzen",
    produces: ["Sales"],
    blocks: [{ node: "PIM", layer: "Sales Layer" }],
    impact: "Ohne Vertriebsdaten: schwache Conversion, viele Rückfragen, geringe Sichtbarkeit.",
    done: false,
    due: "Heute",
  },
  {
    id: "t-qs",
    dept: "Qualität",
    title: "QS-Attribute (Tests, Freigaben, Hinweise) pflegen",
    produces: ["Quality"],
    blocks: [{ node: "QualityChecker", layer: "QA Gate" }],
    impact: "Ohne QS-Freigabe: Quality Checker blockiert – kein Go-Live.",
    done: true,
    due: "Diese Woche",
  },
  {
    id: "t-pm",
    dept: "Produktmanagement",
    title: "Produktwissen, USPs, Positionierung, Kompatibilitäten",
    produces: ["PM", "Knowledge"],
    blocks: [{ node: "PIM", layer: "Product Knowledge" }],
    impact: "Ohne Produktwissen: schlechte Differenzierung, falsche Erwartungen, Retouren.",
    done: false,
    due: "Dieses Sprint",
  },
  {
    id: "t-marketing",
    dept: "Marketing",
    title: "DAM Assets + Marketingtexte (SEO, Kategorien, Kampagnen)",
    produces: ["DAM", "Marketing"],
    blocks: [{ node: "PIM", layer: "Marketing Layer" }],
    impact: "Ohne DAM/Marketing: unvollständige Darstellung im Shop & Marktplätzen.",
    done: true,
    due: "Diese Woche",
  },
  {
    id: "t-techdoku",
    dept: "TechDoku",
    title: "Benutzeranleitungen/Bedienungsanleitungen bereitstellen",
    produces: ["Manual"],
    blocks: [{ node: "PIM", layer: "Manuals" }],
    impact: "Ohne Anleitung: Reklamationen, Supportkosten, Compliance-Themen.",
    done: false,
    due: "Dieses Sprint",
  },
  {
    id: "t-fitment",
    dept: "Produktmanagement",
    title: "Fahrzeugzuordnung (Fitment) pflegen (Apollo Feed)",
    produces: ["Fitment"],
    blocks: [{ node: "Apollo", layer: "Fitment" }],
    impact: "Ohne Fitment: keine TecDoc/CAT-Distribution, Werkstatt-Sichtbarkeit fällt weg.",
    done: false,
    due: "Diese Woche",
  },
  {
    id: "t-bi",
    dept: "BI",
    title: "Listing-Sheets Templates/Regeln pflegen (OBI/Stahlgruber/ATU/Sportega)",
    produces: ["ListingSheet"],
    blocks: [{ node: "Listings", layer: "Partner Sheets" }],
    impact: "Ohne saubere Sheets: Delisting/Rejected Feeds, manuelle Nacharbeit.",
    done: true,
    due: "Diese Woche",
  },
];

// ---------- Scenarios ----------

const scenarioPresets: Record<ScenarioKey, { active: EdgeKey[]; blurb: string; spawn: PayloadType[] }> = {
  "End-to-End Standard": {
    active: [
      "PDM->SAP",
      "SAP_Einkauf->QC",
      "SAP_Logistik->QC",
      "SAP_Werk->QC",
      "SAP_Vertrieb->QC",
      "SAP_Qualität->QC",
      "SAP_PM->QC",
      "QC->PIM",
      "MarketingCloud->PIM",
      "TechDocs->PIM",
      "PIM->Shopify",
      "PIM->Listings",
      "PIM->Apollo",
      "Apollo->TecDocCAT",
      "Listings->Amazon",
    ],
    blurb:
      "Kompletter Datenfluss: PDM → SAP (Sichten) → Quality Gate → PIM → Kanäle. Zeigt, warum jede Abteilung ein zwingender Schritt in der Chain ist.",
    spawn: ["Core", "Price", "Logistics", "Plant", "Sales", "Quality", "PM", "DAM", "Manual", "Fitment"],
  },
  "Shopify Übersetzungs-Loop": {
    active: ["PIM->Shopify", "Shopify->TranslationLoop", "TranslationLoop->PIM"],
    blurb:
      "Shopify liefert übersetzte Inhalte zurück in das PIM (DeepL/Transcy). Damit werden Sprachvarianten in PIM konsistent und kanalübergreifend nutzbar.",
    spawn: ["Translation", "Core", "Marketing"],
  },
  "Fahrzeugzuordnung → Apollo → TecDoc/CAT": {
    active: ["PIM->Apollo", "Apollo->TecDocCAT"],
    blurb:
      "Fitment ist ein Multiplikator: Sobald Fahrzeuginfos sauber sind, steigt Reichweite in Werkstatt-/TecDoc-Ökosystemen und Marktplätzen.",
    spawn: ["Fitment"],
  },
  "Listingsheets für Handelspartner": {
    active: ["PIM->Listings", "Listings->Amazon"],
    blurb:
      "Exports als Listing Sheets: Händler brauchen strukturierte, valide Inhalte. Fehlende Felder werden sofort als Blocker sichtbar.",
    spawn: ["ListingSheet", "Core", "Marketing", "Sales"],
  },
  "Qualitäts-Gate (Fehlende Daten simulieren)": {
    active: [
      "PDM->SAP",
      "SAP_Einkauf->QC",
      "SAP_Logistik->QC",
      "SAP_Werk->QC",
      "SAP_Vertrieb->QC",
      "SAP_Qualität->QC",
      "SAP_PM->QC",
      "QC->PIM",
      "PIM->Shopify",
    ],
    blurb:
      "Demonstriert Blocker-Logik: Wenn eine Abteilung nicht liefert, bleibt der Quality Checker rot – und PIM/Shop werden unvollständig.",
    spawn: ["Core", "Quality", "Sales"],
  },
};

// ---------- Helpers ----------

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function clamp01(v: number) {
  return clamp(v, 0, 1);
}

function pct(n: number) {
  return `${Math.round(n * 100)}%`;
}

function nodeByKey(k: NodeKey) {
  return nodes.find((n) => n.key === k)!;
}

function edgeByKey(k: EdgeKey) {
  return edges.find((e) => e.key === k)!;
}

function severityFromTasks(tasks: Task[]) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const ratio = total === 0 ? 1 : done / total;
  const score = Math.round(ratio * 100);
  return { done, total, ratio, score };
}

// ---------- Payload animation model ----------

type LivePayload = {
  id: string;
  edge: EdgeKey;
  type: PayloadType;
  createdAt: number;
  durationMs: number;
};

function uid(prefix = "p") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

// ---------- UI Components ----------

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/80">
      {children}
    </span>
  );
}

function NodeCard({
  node,
  health,
  onClick,
  selected,
  style,
  onPointerDown,
  dimmed,
}: {
  node: Node;
  health: "ok" | "warn" | "bad";
  onClick: () => void;
  selected: boolean;
  style: React.CSSProperties;
  onPointerDown: (e: React.PointerEvent) => void;
  dimmed: boolean;
}) {
  const sizeClass =
    node.size === "lg"
      ? "w-[260px] h-[110px]"
      : node.size === "md"
      ? "w-[220px] h-[92px]"
      : "w-[200px] h-[78px]";

  const healthBadge =
    health === "ok" ? (
      <span className="inline-flex items-center gap-1 text-emerald-300">
        <CheckCircle2 className="h-4 w-4" /> OK
      </span>
    ) : health === "warn" ? (
      <span className="inline-flex items-center gap-1 text-amber-300">
        <AlertTriangle className="h-4 w-4" /> Risiko
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-rose-300">
        <AlertTriangle className="h-4 w-4" /> Blockiert
      </span>
    );

  return (
    <div
      role="button"
      tabIndex={0}
      data-node-hit="1"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e);
      }}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 select-none ${sizeClass} rounded-2xl border text-left transition-all duration-200 ${
        selected
          ? "border-white/30 bg-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.1),0_10px_40px_rgba(0,0,0,0.6)]"
          : "border-white/10 bg-white/[0.06] hover:border-white/20 hover:bg-white/[0.09]"
      } ${dimmed ? "opacity-25" : "opacity-100"}`}
      style={style}
    >
      <div className="flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl border border-white/10 bg-black/30 p-2 text-white/90">{node.icon}</div>
            <div>
              <div className="text-base font-semibold text-white/95">{node.title}</div>
              {node.subtitle ? <div className="text-xs text-white/60">{node.subtitle}</div> : null}
            </div>
          </div>
          <div className="text-xs">{healthBadge}</div>
        </div>

        <div className="flex items-center justify-between">
          <Pill>{node.group}</Pill>
          <span className="text-xs text-white/60 group-hover:text-white/75">Drag • Click</span>
        </div>
      </div>
    </div>
  );
}

function Gauge({ label, value }: { label: string; value: number }) {
  const v = clamp01(value);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-white/70">
        <span>{label}</span>
        <span className="tabular-nums">{Math.round(v * 100)}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-white/70" style={{ width: `${Math.round(v * 100)}%` }} />
      </div>
    </div>
  );
}

// ---------- Main Page ----------

export default function Page() {
  const [scenario, setScenario] = useState<ScenarioKey>("End-to-End Standard");
  const [running, setRunning] = useState(true);
  const [speed, setSpeed] = useState<0.6 | 1 | 1.4>(1);
  const [selectedNode, setSelectedNode] = useState<NodeKey>("PIM");
  const [tasks, setTasks] = useState<Task[]>(() => baseTasks);

  const [view, setView] = useState<{ scale: number; pan: Vec2 }>({ scale: 1, pan: { x: 0, y: 0 } });
  const [focus, setFocus] = useState<FocusMode>({ kind: "off" });
  const [nodeOffsets, setNodeOffsets] = useState<Record<NodeKey, Vec2>>(() => {
    const o: Record<NodeKey, Vec2> = {} as Record<NodeKey, Vec2>;
    for (const n of nodes) o[n.key] = { x: 0, y: 0 };
    return o;
  });

  const [payloads, setPayloads] = useState<LivePayload[]>([]);
  const lastSpawnRef = useRef<number>(Date.now());

  const preset = scenarioPresets[scenario];

  const completeness = useMemo(() => severityFromTasks(tasks), [tasks]);

  const completenessByType = useMemo(() => {
    const types: PayloadType[] = [
      "Core",
      "Price",
      "Logistics",
      "Plant",
      "Sales",
      "Quality",
      "PM",
      "DAM",
      "Manual",
      "Marketing",
      "Fitment",
      "Knowledge",
      "ListingSheet",
      "Translation",
    ];

    const out: Record<PayloadType, { done: number; total: number; ratio: number }> = {} as Record<
      PayloadType,
      { done: number; total: number; ratio: number }
    >;
    for (const t of types) {
      const related = tasks.filter((x) => x.produces.includes(t));
      const total = related.length;
      const done = related.filter((x) => x.done).length;
      out[t] = { done, total, ratio: total === 0 ? 1 : done / total };
    }
    return out;
  }, [tasks]);

  const qcBlocked = useMemo(() => {
    const required: PayloadType[] = ["Price", "Logistics", "Plant", "Sales", "Quality", "PM", "Core"];
    const ok = required.every((t) => completenessByType[t].ratio >= 0.999 || completenessByType[t].total === 0);
    return !ok;
  }, [completenessByType]);

  const pimBlocked = useMemo(() => {
    const required: PayloadType[] = ["Core", "DAM", "Marketing", "Sales", "Manual", "Fitment", "Knowledge"];
    const ok = required.every((t) => completenessByType[t].ratio >= 0.999 || completenessByType[t].total === 0);
    return !ok;
  }, [completenessByType]);

  const channelRisk = useMemo(() => {
    const shopifyOk = ["Core", "DAM", "Marketing", "Sales"].every((t) => completenessByType[t].ratio >= 0.999);
    const listingsOk = ["Core", "Marketing", "Sales", "ListingSheet"].every((t) => completenessByType[t].ratio >= 0.999);
    const tecdocOk = ["Fitment"].every((t) => completenessByType[t].ratio >= 0.999);
    return {
      shopify: !shopifyOk,
      listings: !listingsOk,
      tecdoc: !tecdocOk,
    };
  }, [completenessByType]);

  const nodeHealth = useMemo(() => {
    const health: Record<NodeKey, "ok" | "warn" | "bad"> = {} as Record<NodeKey, "ok" | "warn" | "bad">;

    for (const n of nodes) health[n.key] = "ok";

    if (completenessByType.Core.ratio < 0.999) health.SAP = "bad";
    health.QualityChecker = qcBlocked ? "bad" : "ok";
    if (qcBlocked) health.PIM = "bad";
    else if (pimBlocked) health.PIM = "warn";

    health.Shopify = channelRisk.shopify ? "warn" : "ok";
    health.Listings = channelRisk.listings ? "warn" : "ok";
    health.Amazon = channelRisk.listings ? "warn" : "ok";
    health.Apollo = channelRisk.tecdoc ? "warn" : "ok";
    health.TecDocCAT = channelRisk.tecdoc ? "warn" : "ok";

    return health;
  }, [channelRisk, completenessByType, pimBlocked, qcBlocked]);

  useEffect(() => {
    if (scenario !== "Qualitäts-Gate (Fehlende Daten simulieren)") return;
    setTasks((prev) =>
      prev.map((t) => ("t-einkauf" === t.id || "t-vertrieb" === t.id || "t-techdoku" === t.id ? { ...t, done: false } : t))
    );
  }, [scenario]);

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const dt = now - lastSpawnRef.current;
      const baseCadence = 650;
      const cadence = baseCadence / speed;

      if (dt < cadence) return;
      lastSpawnRef.current = now;

      const activeEdges = preset.active.filter((k) => (k === "QC->PIM" ? !qcBlocked : true));
      if (activeEdges.length === 0) return;

      const edgeKey = activeEdges[Math.floor(Math.random() * activeEdges.length)];
      const edge = edgeByKey(edgeKey);

      const allowed = edge.payloads.filter((p) => preset.spawn.includes(p));
      if (allowed.length === 0) return;

      const downstream = [
        "PIM->Shopify",
        "PIM->Listings",
        "PIM->Apollo",
        "Listings->Amazon",
        "Apollo->TecDocCAT",
      ].includes(edgeKey);
      if (downstream && pimBlocked && Math.random() < 0.55) return;

      const pick = allowed[Math.floor(Math.random() * allowed.length)];
      const ratio = completenessByType[pick]?.ratio ?? 1;
      if (ratio < 0.999 && Math.random() < 0.65) return;

      const durationMs = Math.round((1800 + Math.random() * 1400) / speed);

      setPayloads((prev) => [
        ...prev,
        {
          id: uid("pl"),
          edge: edgeKey,
          type: pick,
          createdAt: now,
          durationMs,
        },
      ]);

      setPayloads((prev) => prev.filter((p) => now - p.createdAt < p.durationMs + 200));
    }, 90);

    return () => clearInterval(timer);
  }, [running, speed, preset, qcBlocked, pimBlocked, completenessByType]);

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const reset = () => {
    setTasks(baseTasks);
    setScenario("End-to-End Standard");
    setPayloads([]);
    setSelectedNode("PIM");
    setRunning(true);
    setSpeed(1);
    setFocus({ kind: "off" });
  };

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 1200, h: 720 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setContainerSize({ w: Math.max(800, r.width), h: Math.max(520, r.height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const posPx = (k: NodeKey) => {
    const n = nodeByKey(k);
    const off = nodeOffsets[k] ?? { x: 0, y: 0 };
    return {
      x: n.pos.x * containerSize.w + off.x,
      y: n.pos.y * containerSize.h + off.y,
    };
  };

  const activeEdgeSet = useMemo(() => new Set(preset.active), [preset.active]);

  const focusEdgeSet = useMemo(() => {
    if (focus.kind === "off") return activeEdgeSet;

    const keep = new Set<EdgeKey>();
    if (focus.kind === "edge") {
      keep.add(focus.edge);
      return keep;
    }

    const start = focus.node;
    const q: NodeKey[] = [start];
    const seen = new Set<NodeKey>([start]);
    while (q.length) {
      const cur = q.shift()!;
      for (const e of edges) {
        if (!activeEdgeSet.has(e.key)) continue;
        if (e.from !== cur && e.to !== cur) continue;
        keep.add(e.key);
        const other = e.from === cur ? e.to : e.from;
        if (!seen.has(other)) {
          seen.add(other);
          q.push(other);
        }
      }
    }
    return keep;
  }, [focus, activeEdgeSet]);

  const focusNodeSet = useMemo(() => {
    if (focus.kind === "off") return new Set<NodeKey>(nodes.map((n) => n.key));
    const s = new Set<NodeKey>();
    for (const ek of focusEdgeSet) {
      const e = edgeByKey(ek);
      s.add(e.from);
      s.add(e.to);
    }
    if (focus.kind === "node") s.add(focus.node);
    return s;
  }, [focus, focusEdgeSet]);

  const selectedNodeInfo = useMemo(() => nodeByKey(selectedNode), [selectedNode]);

  const blockers = useMemo(() => {
    const missing: { type: PayloadType; label: string }[] = [];
    const important: PayloadType[] = [
      "Core",
      "Price",
      "Logistics",
      "Plant",
      "Sales",
      "Quality",
      "PM",
      "DAM",
      "Manual",
      "Marketing",
      "Fitment",
      "Knowledge",
      "ListingSheet",
    ];
    for (const t of important) {
      const info = completenessByType[t];
      if (info.total > 0 && info.ratio < 0.999) missing.push({ type: t, label: payloadStyle[t].label });
    }
    return missing;
  }, [completenessByType]);

  const deptSummary = useMemo(() => {
    const depts: DeptKey[] = [
      "Entwicklung",
      "Einkauf",
      "Logistik",
      "Werk",
      "Vertrieb",
      "Qualität",
      "Produktmanagement",
      "Marketing",
      "TechDoku",
      "BI",
    ];
    return depts.map((d) => {
      const ts = tasks.filter((t) => t.dept === d);
      const done = ts.filter((t) => t.done).length;
      const ratio = ts.length === 0 ? 1 : done / ts.length;
      return { dept: d, done, total: ts.length, ratio };
    });
  }, [tasks]);

  return (
    <div className="min-h-screen bg-[#070A12] text-white">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#070A12]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold">Atera PIS Dataflow Visualizer</div>
              <div className="text-xs text-white/60">Datenstrom, Verantwortlichkeiten, Blocker — visuell & simulationsfähig</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRunning((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
            >
              {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {running ? "Pause" : "Play"}
            </button>

            <button
              onClick={() => setSpeed((s) => (s === 0.6 ? 1 : s === 1 ? 1.4 : 0.6))}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              title="Simulationsgeschwindigkeit"
            >
              <Zap className="h-4 w-4" />
              {speed === 0.6 ? "0.6×" : speed === 1 ? "1×" : "1.4×"}
            </button>

            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              title="Reset"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-6 px-6 py-6">
        <div className="col-span-12 lg:col-span-8">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Pill>Scenario</Pill>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value as ScenarioKey)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white/90 outline-none"
                >
                  {(Object.keys(scenarioPresets) as ScenarioKey[]).map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="max-w-[620px] text-xs text-white/65">{preset.blurb}</div>
            </div>

            <div
              ref={containerRef}
              onWheel={(e) => {
                e.preventDefault();
                const delta = -e.deltaY;
                const zoomIntensity = 0.0012;
                const oldScale = view.scale;
                const newScale = clamp(oldScale * (1 + delta * zoomIntensity), 0.65, 1.7);

                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const cx = e.clientX - rect.left;
                const cy = e.clientY - rect.top;

                const wx = (cx - view.pan.x) / oldScale;
                const wy = (cy - view.pan.y) / oldScale;

                const panX = cx - wx * newScale;
                const panY = cy - wy * newScale;

                setView({ scale: newScale, pan: { x: panX, y: panY } });
              }}
              onDoubleClick={() => setView({ scale: 1, pan: { x: 0, y: 0 } })}
              className="relative h-[560px] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-black/30"
            >
              <div className="pointer-events-none absolute inset-0 opacity-40">
                <div className="absolute left-[10%] top-[10%] h-[260px] w-[260px] rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute right-[15%] top-[15%] h-[240px] w-[240px] rounded-full bg-fuchsia-500/20 blur-3xl" />
                <div className="absolute left-[35%] bottom-[10%] h-[280px] w-[280px] rounded-full bg-amber-500/15 blur-3xl" />
              </div>

              <div
                className="absolute inset-0"
                onPointerDown={(e) => {
                  const t = e.target as HTMLElement;
                  if (t.closest("[data-node-hit='1']") || t.closest("[data-edge-hit='1']")) return;
                  (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
                  const start = { x: e.clientX, y: e.clientY };
                  const pan0 = { ...view.pan };

                  const move = (ev: PointerEvent) => {
                    const dx = ev.clientX - start.x;
                    const dy = ev.clientY - start.y;
                    setView((v) => ({ ...v, pan: { x: pan0.x + dx, y: pan0.y + dy } }));
                  };
                  const up = () => {
                    window.removeEventListener("pointermove", move);
                    window.removeEventListener("pointerup", up);
                  };
                  window.addEventListener("pointermove", move);
                  window.addEventListener("pointerup", up);
                }}
              />

              <div
                className="absolute left-0 top-0"
                style={{
                  width: containerSize.w,
                  height: containerSize.h,
                  transform: `translate(${view.pan.x}px, ${view.pan.y}px) scale(${view.scale})`,
                  transformOrigin: "0 0",
                }}
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute left-0 top-0 h-full w-[18%] border-r border-white/10 bg-white/[0.02]">
                    <div className="p-3 text-xs font-semibold text-white/55">Upstream</div>
                  </div>
                  <div className="absolute left-[18%] top-0 h-full w-[30%] border-r border-white/10 bg-white/[0.03]">
                    <div className="p-3 text-xs font-semibold text-white/55">SAP Layer</div>
                  </div>
                  <div className="absolute left-[48%] top-0 h-full w-[14%] border-r border-white/10 bg-emerald-500/5">
                    <div className="p-3 text-xs font-semibold text-emerald-200/70">Validation</div>
                  </div>
                  <div className="absolute left-[62%] top-0 h-full w-[16%] border-r border-white/10 bg-fuchsia-500/5">
                    <div className="p-3 text-xs font-semibold text-fuchsia-200/70">PIM Core</div>
                  </div>
                  <div className="absolute left-[78%] top-0 h-full w-[22%] bg-amber-500/5">
                    <div className="p-3 text-xs font-semibold text-amber-200/70">Distribution</div>
                  </div>
                </div>

                <svg className="absolute inset-0" width={containerSize.w} height={containerSize.h}>
                  <defs>
                    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {edges.map((e) => {
                    const a = posPx(e.from);
                    const b = posPx(e.to);
                    const midx = (a.x + b.x) / 2;
                    const midy = (a.y + b.y) / 2 - 20;
                    const path = `M ${a.x} ${a.y} Q ${midx} ${midy} ${b.x} ${b.y}`;

                    const active = activeEdgeSet.has(e.key);
                    const focused = focusEdgeSet.has(e.key);
                    const dimmed = !focused;

                    const color = e.kind === "sync" ? "#60a5fa" : e.kind === "manual" ? "#f59e0b" : "#c084fc";

                    return (
                      <g key={e.key} data-edge-hit="1">
                        <path
                          d={path}
                          fill="none"
                          stroke="#111827"
                          strokeWidth={8}
                          strokeOpacity={dimmed ? 0.3 : 0.6}
                          filter="url(#softGlow)"
                        />
                        <path
                          d={path}
                          fill="none"
                          stroke={color}
                          strokeDasharray={e.kind === "async" ? "12 10" : undefined}
                          strokeWidth={4}
                          strokeOpacity={dimmed ? 0.25 : active ? 0.9 : 0.4}
                          onPointerDown={(ev) => {
                            ev.stopPropagation();
                            setFocus({ kind: "edge", edge: e.key });
                          }}
                        />
                        <text
                          x={midx}
                          y={midy - 8}
                          textAnchor="middle"
                          className="pointer-events-none select-none text-[11px] fill-white/80"
                        >
                          {e.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <AnimatePresence>
                  {payloads.map((p) => {
                    const edge = edgeByKey(p.edge);
                    const from = posPx(edge.from);
                    const to = posPx(edge.to);
                    const styleInfo = payloadStyle[p.type];
                    const colorClass = `${styleInfo.fill} ${styleInfo.ring}`;

                    return (
                      <motion.div
                        key={p.id}
                        initial={{ x: from.x, y: from.y, opacity: 0 }}
                        animate={{ x: to.x, y: to.y, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: p.durationMs / 1000, ease: "linear" }}
                        className={`absolute -translate-x-2 -translate-y-2 rounded-full px-2 py-1 text-[10px] font-semibold text-white shadow-lg ring-2 ${colorClass}`}
                      >
                        {styleInfo.label}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {nodes.map((n) => {
                  const pos = posPx(n.key);
                  const selected = selectedNode === n.key;
                  const dimmed = !focusNodeSet.has(n.key);

                  return (
                    <NodeCard
                      key={n.key}
                      node={n}
                      health={nodeHealth[n.key] ?? "ok"}
                      selected={selected}
                      onClick={() => {
                        setSelectedNode(n.key);
                        setFocus({ kind: "node", node: n.key });
                      }}
                      onPointerDown={(e) => {
                        const start = { x: e.clientX, y: e.clientY };
                        const off0 = nodeOffsets[n.key] ?? { x: 0, y: 0 };
                        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);

                        const move = (ev: PointerEvent) => {
                          const dx = ev.clientX - start.x;
                          const dy = ev.clientY - start.y;
                          setNodeOffsets((prev) => ({ ...prev, [n.key]: { x: off0.x + dx, y: off0.y + dy } }));
                        };
                        const up = () => {
                          window.removeEventListener("pointermove", move);
                          window.removeEventListener("pointerup", up);
                        };
                        window.addEventListener("pointermove", move);
                        window.addEventListener("pointerup", up);
                      }}
                      style={{ left: pos.x, top: pos.y }}
                      dimmed={dimmed}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 space-y-4 lg:col-span-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-sm uppercase tracking-wide text-white/60">Übersicht</div>
                <div className="text-lg font-semibold">Quality & Enrichment</div>
              </div>
              <Pill>{pct(completeness.ratio)}</Pill>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Gauge label="Gesamt-Komplettheit" value={completeness.ratio} />
              <Gauge label="PIM Blocker" value={pimBlocked ? 0.35 : 1} />
              <Gauge label="Quality Gate" value={qcBlocked ? 0.4 : 1} />
              <Gauge label="Shopify Risiko" value={channelRisk.shopify ? 0.6 : 1} />
            </div>

            {blockers.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-100">
                <div className="mb-2 flex items-center gap-2 text-rose-200">
                  <AlertTriangle className="h-4 w-4" /> Fehlende Daten: {blockers.length}
                </div>
                <div className="flex flex-wrap gap-2">
                  {blockers.map((b) => (
                    <Pill key={b.type}>{b.label}</Pill>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="h-4 w-4" /> Alle Pflicht-Daten vollständig
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Tasks nach Abteilung</div>
              <Pill>Focus: {focus.kind === "node" ? focus.node : focus.kind === "edge" ? "Edge" : "Off"}</Pill>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {deptSummary.map((d) => (
                <div key={d.dept} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${deptColor[d.dept]}`} />
                    <span>{d.dept}</span>
                  </div>
                  <span className="text-white/70">{d.done}/{d.total}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Aufgaben</div>
              <button
                onClick={() => setTasks(baseTasks)}
                className="text-xs text-white/60 underline underline-offset-2 hover:text-white"
              >
                Reset Tasks
              </button>
            </div>
            <div className="space-y-2">
              {tasks.map((t) => (
                <div key={t.id} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${deptColor[t.dept]}`} />
                      <span>{t.title}</span>
                    </div>
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        t.done ? "bg-emerald-600/80" : "bg-white/10"
                      }`}
                    >
                      {t.done ? "Done" : "Open"}
                    </button>
                  </div>
                  <div className="mb-1 text-xs text-white/70">Blockiert: {t.blocks.map((b) => `${b.node} (${b.layer})`).join(", ")}</div>
                  <div className="mb-1 text-xs text-white/70">Impact: {t.impact}</div>
                  <div className="text-[11px] text-white/50">Due: {t.due}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-lg">
            <div className="mb-2 text-lg font-semibold">Selektierter Knoten</div>
            <div className="text-sm text-white/80">{selectedNodeInfo.title}</div>
            {selectedNodeInfo.subtitle ? <div className="text-xs text-white/60">{selectedNodeInfo.subtitle}</div> : null}
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-white/70">
              <Pill>Layer: {selectedNodeInfo.group}</Pill>
              <Pill>Status: {nodeHealth[selectedNode] ?? "ok"}</Pill>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

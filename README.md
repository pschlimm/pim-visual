# PIS Dataflow Visualizer

A Next.js + Tailwind demo that renders the interactive PIM/PIS dataflow visualizer. The `app/page.tsx` file contains the full experience (scenario presets, animated payloads, draggable nodes, focus, dashboards, etc.).

## Entwicklung lokal
1. Abhängigkeiten installieren: `npm install`
2. Dev-Server starten: `npm run dev` und die angezeigte URL im Browser öffnen.

> Hinweis: Sollte der Paket-Download in der aktuellen Umgebung blockiert sein (z. B. 403 vom npm-Registry), den Befehl in einer Umgebung mit npm-Zugriff oder direkt auf Vercel ausführen.

## Deployment auf Vercel
1. Repository in Vercel importieren.
2. Build Command: `npm run build` (Standard)
3. Output Directory: `.next` (Standard)
4. Development Command für Previews: `npm run dev`

Tailwind wird automatisch über `app/globals.css` eingebunden, zusätzliche Konfiguration ist nicht nötig.

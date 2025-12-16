# pim-visual

Eine rein clientseitige React-Visualisierung, die den Datenstrom vom PDM bis zu den Ausleitungs-Szenarien zeigt. Die Seite nutzt React über CDN (ohne Build-Tooling) und kann deshalb mit einem simplen Static-Server geöffnet werden.

## Starten

```bash
python -m http.server 4173
# anschließend http://localhost:4173 im Browser öffnen
```

## Features
- Animierte Payload-Streams, die den Weg über Qualitäts-Checker, PIM Core und nachgelagerte Systeme zeigen.
- Abteilungsbereich mit Aufgaben, Status-Highlighting und der Möglichkeit, fehlende Beiträge zu simulieren.
- Übersicht der Ausleitungs-Szenarien (SAP, Shopify, Apollo/TecDoc, Marktplätze, Listing Sheets) mit ihren Datenanforderungen.

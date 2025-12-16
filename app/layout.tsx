import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PIS Dataflow Visualizer",
  description: "Interaktive Visualisierung der Produktinformationsströme",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}

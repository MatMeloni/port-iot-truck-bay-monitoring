import type { Metadata } from "next";
import "./globals.css";
import { AppNav } from "@/components/AppNav";

export const metadata: Metadata = {
  title: "Port IoT – Truck Bay Monitoring",
  description: "Porto de Santos · ESP32 + MQTT + Next.js dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen bg-slate-50 text-foreground">
        <AppNav />
        {children}
      </body>
    </html>
  );
}

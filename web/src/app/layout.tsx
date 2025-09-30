import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Port IoT – Truck Bay Monitoring",
  description: "ESP32 + MQTT + Next.js dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}

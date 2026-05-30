import React from "react";
import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "StreamFlix — Premium Streaming",
  description: "Stream movies and TV shows in UHD quality.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        <QueryProvider>
          <Navbar />
          <main className="pt-16">{children}</main>
        </QueryProvider>
      </body>
    </html>
  );
}

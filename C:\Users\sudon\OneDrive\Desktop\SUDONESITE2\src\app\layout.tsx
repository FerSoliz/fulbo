import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MainSidebar } from "@/components/main-sidebar";
import { PageHeader } from "@/components/page-header";
import { Bug, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/data";
import { users } from "@/lib/data";

export const metadata: Metadata = {
  title: "SUDONE - PRUEBA DE EDICIÓN",
  description: "Plataforma de torneos y comunidad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user: User = users[0]; // Always use the first user as the current user for now

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased bg-background">
        <div className="flex">
          <MainSidebar user={user} />
          <div className="flex flex-1 flex-col md:ml-64">
            <PageHeader user={user} />
            <main>{children}</main>
          </div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}

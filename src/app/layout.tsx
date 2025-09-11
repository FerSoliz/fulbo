import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MainSidebar } from "@/components/main-sidebar";
import { PageHeader } from "@/components/page-header";
import { Bug, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/data";

export const metadata: Metadata = {
  title: "SUDONE",
  description: "Plataforma de torneos y comunidad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user: User = {
    id: 'user-1',
    name: 'Carlos Estevez',
    role: 'admin',
    avatar: 'https://i.postimg.cc/xTT3zpg1/MARADONA-Y-EL-PURO-e1630357319461.jpg',
    location: 'Buenos Aires, Argentina',
    isVerified: true,
    sudpoints: 0,
    baseSudpoints: 0,
    league: 'Bronce',
    division: 4,
    stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
  };

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

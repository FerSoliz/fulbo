import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MainSidebar } from "@/components/main-sidebar";
import { PageHeader } from "@/components/page-header";
import { Bug, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "SUDONE",
  description: "Plataforma de torneos y comunidad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = {
    id: '123',
    role: 'admin',
    avatarUrl: 'https://i.postimg.cc/xTT3zpg1/MARADONA-Y-EL-PURO-e1630357319461.jpg',
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

        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
            <Button size="lg" className="pl-4 pr-5">
                <>
                    <MessageSquare className="mr-2 h-5 w-5" />
                    MENSAJES
                </>
            </Button>
            {user.role === 'admin' && (
                <Button variant="outline" size="icon">
                    <>
                        <Sparkles className="h-5 w-5 text-yellow-400" />
                        <span className="sr-only">Asistente IA</span>
                    </>
                </Button>
            )}
            <Button variant="outline" size="icon">
                <>
                    <Bug className="h-5 w-5" />
                    <span className="sr-only">Reportar Error</span>
                </>
            </Button>
        </div>
        <Toaster />
      </body>
    </html>
  );
}

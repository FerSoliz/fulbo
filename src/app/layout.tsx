import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/main-sidebar";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Bug, Sparkles, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "SUDONE",
  description: "Plataforma de torneos y comunidad.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Mock user data, assuming 'admin' role for now
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
      <body className="font-body antialiased">
        <SidebarProvider>
          <div className="flex">
            <Sidebar asChild className="w-64 flex-col fixed inset-y-0 z-50 hidden md:flex border-r">
                <MainSidebar user={user} />
            </Sidebar>
            <div className="flex-1 md:ml-64">
              <PageHeader />
              <main>{children}</main>
            </div>
          </div>
        </SidebarProvider>

        <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
           <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
            <Bug className="h-5 w-5" />
            <span className="sr-only">Reportar Error</span>
          </Button>
          {user.role === 'admin' && (
            <Button variant="outline" size="icon" className="rounded-full w-10 h-10">
              <Sparkles className="h-5 w-5 text-yellow-400" />
              <span className="sr-only">Asistente IA</span>
            </Button>
          )}
          <Button size="lg" className="pl-4 pr-5 rounded-full">
            <MessageSquare className="mr-2 h-5 w-5" />
            MENSAJES
          </Button>
        </div>

        <Toaster />
      </body>
    </html>
  );
}

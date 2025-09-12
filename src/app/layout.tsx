
'use client';
import { useState, useEffect } from 'react';
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MainSidebar } from "@/components/main-sidebar";
import { PageHeader } from "@/components/page-header";
import type { User } from "@/lib/data";
import { users as initialUsers } from "@/lib/data";
import { UserProvider } from '@/context/user-context';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
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
        <UserProvider>
            <LayoutContent>{children}</LayoutContent>
        </UserProvider>
      </body>
    </html>
  );
}


function LayoutContent({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                // Si no hay usuario, usamos el primero de la lista como default
                const defaultUser = initialUsers[0];
                setUser(defaultUser);
                localStorage.setItem('currentUser', JSON.stringify(defaultUser));
            }
        } catch (error) {
            console.error("Failed to parse user from localStorage", error);
            const defaultUser = initialUsers[0];
            setUser(defaultUser);
        } finally {
            setLoading(false);
        }
    }, []);

    if (loading) {
        // Puedes mostrar un esqueleto o un loader aquí mientras se determina el usuario
        return (
             <div className="flex">
                <aside className="fixed left-0 hidden h-screen w-64 flex-col border-r bg-card md:flex"></aside>
                <div className="flex flex-1 flex-col md:ml-64">
                    <main>{children}</main>
                </div>
            </div>
        );
    }
    
    if (!user) {
        // Manejar el caso en que no se pudo cargar ningún usuario
        return <div>Error al cargar el perfil de usuario.</div>;
    }

    return (
        <div className="flex">
            <MainSidebar user={user} />
            <div className="flex flex-1 flex-col md:ml-64">
                <PageHeader user={user} />
                <main>{children}</main>
            </div>
            <Toaster />
        </div>
    );
}


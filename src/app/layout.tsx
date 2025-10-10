'use client';
import { useState, useEffect } from 'react';
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MainSidebar } from "@/components/main-sidebar";
import { PageHeader } from "@/components/page-header";
import type { User } from "@/lib/data";
import { UserProvider } from '@/context/user-context';
import { CartProvider } from '@/context/cart-context';
import { CartWidget } from '@/components/cart/cart-widget';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="https://i.postimg.cc/1zpZ1G3p/favicon.png" type="image/png" />
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
          <CartProvider>
            <LayoutContent>{children}</LayoutContent>
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}


function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
    const isImmersivePage = pathname.startsWith('/collectibles');
    // Nueva lógica: El carrito solo se muestra si la ruta empieza con /store
    const showCart = pathname.startsWith('/store');

    if (isAuthPage || isImmersivePage) {
        return (
          <>
            <main>{children}</main>
            <Toaster />
          </>
        );
    }

    return (
        <div className="flex">
            <MainSidebar />
            <div className="flex flex-1 flex-col md:ml-72">
                <PageHeader />
                <main>{children}</main>
            </div>
            {showCart && <CartWidget />} {/* El widget ahora solo se renderiza en la tienda */}
            <Toaster />
        </div>
    );
}

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
import { useIsMobile } from '@/hooks/use-mobile';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
      <body className="font-body antialiased bg-background-mobile md:bg-background-desktop bg-cover bg-center bg-fixed">
        <UserProvider>
          <CartProvider>
            <LayoutContent>{children}</LayoutContent>
            <Toaster />
          </CartProvider>
        </UserProvider>
      </body>
    </html>
  );
}


function LayoutContent({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isMobile = useIsMobile();
    
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
    const isImmersivePage = pathname.startsWith('/collectibles');

    // Show floating cart button only on store page AND on desktop.
    const showFloatingCart = pathname.startsWith('/store') && !isMobile;

    if (isAuthPage || isImmersivePage) {
        return (
          <>
            <main>{children}</main>
          </> 
        );
    }

    return (
        <div className="flex">
            <MainSidebar />
            <div className="relative flex flex-1 flex-col md:ml-72">
                <PageHeader />
                <main className="flex-1">{children}</main>
                {showFloatingCart && <CartWidget variant="floating" />}
            </div>
        </div>
    );
}

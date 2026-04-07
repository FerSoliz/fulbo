'use client';
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { MainSidebar } from "@/components/main-sidebar";
import { PageHeader } from "@/components/page-header";
import { UserProvider } from '@/context/user-context';
import { CartProvider } from '@/context/cart-context';
import { CartWidget } from '@/components/cart/cart-widget';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { InstallPwaBanner } from '@/components/install-pwa-banner';
import { PwaProvider, usePwa } from '@/context/pwa-context'; // 1. Importar el Provider y el Hook

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
        <link rel="icon" href="/assets/icons/favicon.ico" type="image/x-icon" />
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
            {/* 2. Envolver la aplicación con el PwaProvider */}
            <PwaProvider>
              <LayoutContent>{children}</LayoutContent>
            </PwaProvider>
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
    // 3. Usar el hook para obtener el estado y las funciones
    const { showInstallBanner, handleInstallPrompt, handleDismissBanner } = usePwa();
    
    const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
    const isImmersivePage = pathname.startsWith('/collectibles');

    const showFloatingCart = pathname.startsWith('/store') && !isMobile;

    if (isAuthPage || isImmersivePage) {
        return (
          <>
            <main>{children}</main>
            {/* 4. El banner se muestra según el estado del contexto */}
            {showInstallBanner && <InstallPwaBanner onInstall={handleInstallPrompt} onDismiss={handleDismissBanner} />}
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
            {/* 4. El banner se muestra según el estado del contexto */}
            {showInstallBanner && <InstallPwaBanner onInstall={handleInstallPrompt} onDismiss={handleDismissBanner} />}
        </div>
    );
}

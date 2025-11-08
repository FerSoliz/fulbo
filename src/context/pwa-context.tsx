'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

// 1. Definir la interfaz para el evento de instalación
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string; }>;
  prompt(): Promise<void>;
}

// 2. Definir la forma del contexto
interface PwaContextType {
  installPrompt: BeforeInstallPromptEvent | null;
  showInstallBanner: boolean;
  handleInstallPrompt: () => void;
  handleDismissBanner: () => void;
}

// 3. Crear el Contexto con un valor por defecto
const PwaContext = createContext<PwaContextType | undefined>(undefined);

// 4. Crear el componente Provider
export function PwaProvider({ children }: { children: ReactNode }) {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      if (sessionStorage.getItem('installBannerDismissed') !== 'true') {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPrompt = useCallback(() => {
    if (!installPrompt) return;

    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      setShowInstallBanner(false);
      setInstallPrompt(null);
    });
  }, [installPrompt]);

  const handleDismissBanner = useCallback(() => {
    setShowInstallBanner(false);
    sessionStorage.setItem('installBannerDismissed', 'true');
  }, []);

  const value = { 
    installPrompt, 
    showInstallBanner, 
    handleInstallPrompt, 
    handleDismissBanner 
  };

  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}

// 5. Crear el custom hook para consumir el contexto
export function usePwa() {
  const context = useContext(PwaContext);
  if (context === undefined) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
}

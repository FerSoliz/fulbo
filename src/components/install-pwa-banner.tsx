'use client';

import { X } from 'lucide-react';
import { Button } from './ui/button';

// Extend the Event interface to include properties specific to BeforeInstallPromptEvent
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallPwaBannerProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export function InstallPwaBanner({ onInstall, onDismiss }: InstallPwaBannerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 w-full bg-container p-4 border-t border-border-soft animate-in slide-in-from-bottom-10 md:bottom-4 md:right-4 md:left-auto md:w-full md:max-w-md md:rounded-lg md:border">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-grow">
          <h4 className="font-bold text-white">Acceso Directo a SudOne</h4>
          <p className="text-sm text-gray-300 mt-1">
            Instala la aplicación para una mejor experiencia móvil.
          </p>
        </div>
        <div className="flex items-center shrink-0">
          <Button onClick={onInstall} className="mr-2 bg-accent-red hover:bg-accent-red/90 text-white">
            Instalar
          </Button>
          <Button variant="ghost" size="icon" onClick={onDismiss} className="text-gray-400 hover:text-white">
            <X size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}

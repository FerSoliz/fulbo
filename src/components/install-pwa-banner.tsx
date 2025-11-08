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
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md rounded-lg bg-container p-4 shadow-lg border border-border-soft animate-in slide-in-from-bottom-10">
      <div className="flex items-center justify-between">
        <div className="pr-4">
          <h4 className="font-bold text-white">¡Llevá SudOne con vos!</h4>
          <p className="text-sm text-gray-300 mt-1">
            Instalá la aplicación en tu dispositivo para un acceso rápido y una mejor experiencia.
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

'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ProfileNavProps {
  activeTab: 'perfil' | 'equipo';
  onTabChange: (tab: 'perfil' | 'equipo') => void;
  hasTeam: boolean;
}

export const ProfileNav = ({ activeTab, onTabChange, hasTeam }: ProfileNavProps) => {
  if (!hasTeam) {
    return null;
  }
  
  return (
    <div className="pt-1">
      <div className="grid grid-cols-2 gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTabChange('perfil')}
          className={cn(
            'py-1 transition-all duration-200 border-b-2 rounded-none uppercase',
            activeTab === 'perfil'
              ? 'font-bold text-amber-400 border-accent-red hover:bg-transparent hover:text-amber-400'
              : 'text-muted-foreground border-transparent'
          )}
        >
          Perfil
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTabChange('equipo')}
          className={cn(
            'py-1 transition-all duration-200 border-b-2 rounded-none uppercase',
            activeTab === 'equipo'
              ? 'font-bold text-amber-400 border-accent-red hover:bg-transparent hover:text-amber-400'
              : 'text-muted-foreground border-transparent'
          )}
        >
          Equipo
        </Button>
      </div>
    </div>
  );
};

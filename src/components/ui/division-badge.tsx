'use client';

import { cn } from '@/lib/utils';
import { getDivisionInfo } from '@/lib/utils'; // Importamos nuestra nueva función
import { Shield, Gem, Crown, Star } from 'lucide-react';

interface DivisionBadgeProps {
  sudpoints: number;
}

// Mapeo de nombres de íconos a componentes de React
const ICONS: { [key: string]: React.ElementType } = {
  Shield,
  Gem,
  Crown,
  Star,
};

export function DivisionBadge({ sudpoints }: DivisionBadgeProps) {
  // Obtenemos la información de la división basada en los puntos
  const divisionInfo = getDivisionInfo(sudpoints);

  if (!divisionInfo) {
    return null; // No mostrar nada si no hay información
  }

  const Icon = ICONS[divisionInfo.icon] || Star;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5'
      )}
      // Usamos el color dinámico de nuestra función
      style={{ backgroundColor: `${divisionInfo.color}20`, color: divisionInfo.color }}
    >
      <Icon className="h-3 w-3" />
      <span className="font-bold uppercase text-xs">{divisionInfo.name}</span>
      {/* Mostramos el nivel solo si existe */}
      {divisionInfo.level && (
        <span className="font-mono text-[10px] font-bold">{divisionInfo.level}</span>
      )}
    </div>
  );
}

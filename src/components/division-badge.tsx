'use client';

import { cn } from '@/lib/utils';
import { Shield, Gem, Crown, Sparkles, Medal } from 'lucide-react';

// 1. Props actualizadas: ahora solo necesita los sudpoints.
interface DivisionBadgeProps {
  sudpoints: number;
  className?: string;
}

// 2. Definimos nuestras divisiones, basadas 100% en las reglas del proyecto.
const divisions = [
  { name: 'Bronce IV', minSP: 0, color: '#CD7F32', Icon: Shield },
  { name: 'Bronce III', minSP: 100, color: '#CD7F32', Icon: Shield },
  { name: 'Bronce II', minSP: 200, color: '#CD7F32', Icon: Shield },
  { name: 'Bronce I', minSP: 300, color: '#CD7F32', Icon: Shield },
  { name: 'Plata', minSP: 400, color: '#C0C0C0', Icon: Gem },
  { name: 'Oro', minSP: 500, color: '#FFD700', Icon: Crown },
  { name: 'Crack', minSP: 600, color: '#8A2BE2', Icon: Sparkles },
  { name: 'Leyenda Mundial', minSP: 700, color: '#E53E3E', Icon: Medal },
];

// 3. Función interna para calcular la división correcta.
const getDivisionForSudpoints = (sp: number) => {
  // Buscamos de la división más alta a la más baja.
  for (let i = divisions.length - 1; i >= 0; i--) {
    if (sp >= divisions[i].minSP) {
      return divisions[i];
    }
  }
  return divisions[0]; // Si algo falla, se asigna la división más baja.
};

// 4. El nuevo componente, más limpio y funcional.
export function DivisionBadge({ sudpoints, className }: DivisionBadgeProps) {
  const division = getDivisionForSudpoints(sudpoints);
  const { name, color, Icon } = division;

  // Regla especial: para "Leyenda Mundial", mostramos los puntos.
  const isLegend = name === 'Leyenda Mundial';
  const displayText = isLegend ? `${sudpoints} SP` : name;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
        className
      )}
      style={{
        backgroundColor: `${color}20`, // Un fondo con transparencia.
        color: color,                  // El color del texto.
        border: `1px solid ${color}80` // Un borde con transparencia.
      }}
    >
      <Icon className="h-4 w-4" />
      <span>{displayText}</span>
    </div>
  );
}

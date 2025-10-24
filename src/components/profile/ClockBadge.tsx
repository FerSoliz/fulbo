'use client';

import { useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { EnrichedMatch } from '@/hooks/use-upcoming-matches';

interface ClockBadgeProps {
  nextMatch: EnrichedMatch | undefined;
}

export const ClockBadge = ({ nextMatch }: ClockBadgeProps) => {

  const nextMatchTime = useMemo(() => {
    if (!nextMatch?.details?.date) {
      return '- - : - -';
    }
    try {
      const matchDate = new Date(nextMatch.details.date);
      if (isNaN(matchDate.getTime())) {
        return '- - : - -';
      }
      return matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (error) {
      console.error("Error formatting date:", error);
      return '- - : - -';
    }
  }, [nextMatch]);

  return (
    // Contenedor principal reducido
    <div className="relative flex items-center justify-end h-10">
      {/* Tarjeta posicionada y con clip-path corregido */}
      <div className="absolute right-7 z-0">
        <Card className="relative bg-container shadow-md overflow-hidden [clip-path:polygon(0%_0%,_100%_0%,_100%_100%,_12%_100%)] border-0">
          {/* Padding y tamaño de texto reducidos */}
          <div className="py-0.5 pr-5 pl-7">
            <p className="text-white font-semibold text-xs whitespace-nowrap">{nextMatchTime}</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-blue" />
        </Card>
      </div>

      <div className="z-10">
        {/* Avatar reducido */}
        <Avatar className="w-10 h-10 border-2 border-background">
          <AvatarImage src="/assets/profile/reloj.png" alt="Reloj" />
          <AvatarFallback>CL</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

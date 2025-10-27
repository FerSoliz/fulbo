'use client';

import { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { EnrichedMatch } from '@/hooks/use-upcoming-matches';

interface ClockBadgeProps {
  nextMatch: EnrichedMatch | undefined;
}

// Función para calcular la diferencia de tiempo
const calculateTimeLeft = (targetDate: Date) => {
  const difference = targetDate.getTime() - new Date().getTime();
  if (difference <= 0) {
    return null; // El partido ya empezó
  }
  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((difference / 1000 / 60) % 60);
  const seconds = Math.floor((difference / 1000) % 60);
  return { days, hours, minutes, seconds };
};

export const ClockBadge = ({ nextMatch }: ClockBadgeProps) => {

  // 1. Obtener la fecha objetivo del partido de forma segura
  const targetDate = useMemo(() => {
    const dateStr = nextMatch?.details?.date; // "YYYY-MM-DD"
    const timeStr = nextMatch?.details?.time; // "HH:mm" o undefined

    if (!dateStr) return null;

    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours = 0, minutes = 0] = timeStr ? timeStr.split(':').map(Number) : [0, 0];
      // Creamos la fecha usando componentes numéricos para evitar problemas de zona horaria con strings
      return new Date(year, month - 1, day, hours, minutes, 0);
    } catch {
      return null;
    }
  }, [nextMatch]);

  // 2. Estado para guardar el tiempo restante
  const [timeLeft, setTimeLeft] = useState(targetDate ? calculateTimeLeft(targetDate) : null);

  // 3. Efecto para actualizar la cuenta regresiva cada segundo
  useEffect(() => {
    if (!targetDate) {
      setTimeLeft(null);
      return;
    }

    // Actualizar inmediatamente al cargar
    setTimeLeft(calculateTimeLeft(targetDate));

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      setTimeLeft(newTimeLeft);
      if (!newTimeLeft) {
        clearInterval(timer);
      }
    }, 1000);

    // 4. Limpieza del intervalo
    return () => clearInterval(timer);
  }, [targetDate]);

  const getCountdownText = () => {
    if (!targetDate) return '--:--';
    if (!timeLeft) return 'EN JUEGO';

    const { days, hours, minutes, seconds } = timeLeft;

    if (days > 0) {
      return `${days}D ${hours.toString().padStart(2, '0')}H`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex items-center justify-end h-10">
      <div className="absolute right-7 z-0">
        <Card className="relative bg-container shadow-md overflow-hidden [clip-path:polygon(0%_0%,_100%_0%,_100%_100%,_12%_100%)] border-0">
          <div className="py-0.5 pr-5 pl-7 min-w-[90px] text-center"> {/* Ancho mínimo para estabilidad */}
            <p className="text-white font-semibold text-xs whitespace-nowrap">{getCountdownText()}</p>
          </div>
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-accent-blue" />
        </Card>
      </div>

      <div className="z-10">
        <Avatar className="w-10 h-10 border-2 border-background">
          <AvatarImage src="/assets/profile/reloj.png" alt="Reloj" />
          <AvatarFallback>CL</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

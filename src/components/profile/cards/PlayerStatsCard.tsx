'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Star, Shield, Target, Info } from 'lucide-react';
import { usePlayerStats } from '@/hooks/usePlayerStats';

interface PlayerStatsCardProps {
  profileUserId: string;
}

// Componente interno para mostrar un único dato estadístico
const StatItem = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
    <div className="flex flex-col items-center justify-center p-4 bg-secondary/50 rounded-lg text-center h-full">
        <div className="text-amber-400">{icon}</div>
        <p className="text-3xl font-bold mt-2">{value || 0}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
    </div>
);

// Componente interno para mostrar la cuadrícula de estadísticas
const StatsDisplay = ({ stats }: { stats: { matchesPlayed: number; goals: number; assists: number; mvp: number; } }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <StatItem icon={<Shield className="h-8 w-8" />} value={stats.matchesPlayed} label="Partidos" />
        <StatItem icon={<Target className="h-8 w-8" />} value={stats.goals} label="Goles" />
        <StatItem icon={<Star className="h-8 w-8" />} value={stats.assists} label="Asistencias" />
        <StatItem icon={<Trophy className="h-8 w-8" />} value={stats.mvp} label="MVPs" />
    </div>
);

export const PlayerStatsCard = ({ profileUserId }: PlayerStatsCardProps) => {
  const { stats, loading } = usePlayerStats(profileUserId);

  if (loading) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-3/4 mt-1" />
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </CardContent>
        </Card>
    );
  }

  if (!stats?.totals) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rendimiento Total</CardTitle>
          <CardDescription>Resumen de estadísticas clave del jugador.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center h-40 text-center bg-secondary/30 rounded-lg mt-4">
            <Info className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="font-semibold">Sin datos de rendimiento</p>
            <p className="text-sm text-muted-foreground">Este jugador aún no tiene estadísticas registradas.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendimiento Total</CardTitle>
        <CardDescription>Resumen de estadísticas clave del jugador.</CardDescription>
      </CardHeader>
      <CardContent>
        <StatsDisplay stats={stats.totals} />
      </CardContent>
    </Card>
  );
};

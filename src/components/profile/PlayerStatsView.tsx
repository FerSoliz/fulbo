'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Star, Shield, Target, Loader2, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserProfile } from '@/lib/types';
import { ref, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';

// --- Interfaces de Tipos para Estadísticas ---
interface StatDetails {
  matchesPlayed: number;
  goals: number;
  assists: number;
  mvp: number;
}

interface TournamentStat extends StatDetails {
  tournamentName: string;
}

interface PlayerStats {
  totals: StatDetails;
  byTournament?: { [key: string]: TournamentStat };
}

interface PlayerStatsViewProps {
  onClose: () => void;
  profileUser: UserProfile;
}

const StatItem = ({ icon, value, label }: { icon: React.ReactNode, value: number, label: string }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg text-center">
    <div className="text-primary">{icon}</div>
    <p className="text-3xl font-bold mt-2">{value || 0}</p>
    <p className="text-sm text-muted-foreground">{label}</p>
  </div>
);

export const PlayerStatsView = ({ onClose, profileUser }: PlayerStatsViewProps) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profileUser.id) return;

    setLoading(true);
    const statsRef = ref(db, `playerStats/${profileUser.id}`);

    const unsubscribe = onValue(statsRef, (snapshot) => {
      if (snapshot.exists()) {
        setStats(snapshot.val());
      } else {
        setStats(null); // No se encontraron estadísticas para este usuario.
      }
      setLoading(false);
    });

    // Limpiamos el listener cuando el componente se desmonta.
    return () => off(statsRef, 'value', unsubscribe);
  }, [profileUser.id]);

  const renderContent = () => {
    if (loading) {
      return <div className="flex items-center justify-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!stats) {
      return (
        <div className="flex flex-col items-center justify-center h-40 text-center bg-muted/30 rounded-lg">
          <Info className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="font-semibold">Sin datos de rendimiento</p>
          <p className="text-sm text-muted-foreground">Este jugador aún no tiene estadísticas registradas.</p>
        </div>
      );
    }

    return (
      <Tabs defaultValue="totals">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="totals">Totales</TabsTrigger>
          {stats.byTournament && Object.keys(stats.byTournament).map(tourId => (
            <TabsTrigger key={tourId} value={tourId}>
              {stats.byTournament![tourId].tournamentName}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="totals" className="mt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatItem icon={<Shield className="h-8 w-8" />} value={stats.totals.matchesPlayed} label="Partidos" />
            <StatItem icon={<Target className="h-8 w-8" />} value={stats.totals.goals} label="Goles" />
            <StatItem icon={<Star className="h-8 w-8" />} value={stats.totals.assists} label="Asistencias" />
            <StatItem icon={<Trophy className="h-8 w-8" />} value={stats.totals.mvp} label="MVPs" />
          </div>
        </TabsContent>

        {stats.byTournament && Object.entries(stats.byTournament).map(([tourId, tourStats]) => (
           <TabsContent key={tourId} value={tourId} className="mt-4">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatItem icon={<Shield className="h-8 w-8" />} value={tourStats.matchesPlayed} label="Partidos" />
              <StatItem icon={<Target className="h-8 w-8" />} value={tourStats.goals} label="Goles" />
              <StatItem icon={<Star className="h-8 w-8" />} value={tourStats.assists} label="Asistencias" />
              <StatItem icon={<Trophy className="h-8 w-8" />} value={tourStats.mvp} label="MVPs" />
             </div>
           </TabsContent>
        ))}
      </Tabs>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Volver al perfil">
              <ArrowLeft />
            </Button>
            <div>
              <CardTitle>Estadísticas de {profileUser.gamertag}</CardTitle>
              <CardDescription>Rendimiento en todas las competiciones.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </motion.div>
  );
};

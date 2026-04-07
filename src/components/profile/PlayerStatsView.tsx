'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Star, Shield, Target, Loader2, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserProfile } from '@/lib/types';
import { usePlayerStats } from '@/hooks/usePlayerStats';
import { useMediaQuery } from '@/hooks/useMediaQuery';

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

const StatsDisplay = ({ stats }: { stats: { matchesPlayed: number; goals: number; assists?: number; mvp: number; } }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        <StatItem icon={<Shield className="h-8 w-8" />} value={stats.matchesPlayed} label="Partidos" />
        <StatItem icon={<Target className="h-8 w-8" />} value={stats.goals} label="Goles" />
        <StatItem icon={<Star className="h-8 w-8" />} value={stats.assists ?? 0} label="Asistencias" />
        <StatItem icon={<Trophy className="h-8 w-8" />} value={stats.mvp} label="MVPs" />
    </div>
);

export const PlayerStatsView = ({ onClose, profileUser }: PlayerStatsViewProps) => {
  const { stats, loading } = usePlayerStats(profileUser.id);
  const isMobile = useMediaQuery('(max-width: 640px)');
  const [selectedView, setSelectedView] = useState('totals');

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
    
    const currentStats = selectedView === 'totals'
      ? stats.totals
      : stats.byTournament?.[selectedView];

    return (
      <div>
        {isMobile ? (
            <Select onValueChange={setSelectedView} defaultValue={selectedView}>
                <SelectTrigger className="w-full text-base h-11">
                    <SelectValue placeholder="Seleccionar vista..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="totals">Estadísticas Totales</SelectItem>
                    {stats.byTournament && Object.entries(stats.byTournament).map(([tourId, tourStats]) => (
                        <SelectItem key={tourId} value={tourId}>
                            {tourStats.tournamentName}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        ) : (
            <Tabs value={selectedView} onValueChange={setSelectedView}>
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="totals">Totales</TabsTrigger>
                    {stats.byTournament && Object.keys(stats.byTournament).map(tourId => (
                        <TabsTrigger key={tourId} value={tourId}>
                            {stats.byTournament![tourId].tournamentName}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>
        )}
        
        {currentStats && <StatsDisplay stats={currentStats as any} />}
      </div>
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
              <CardDescription>
                {selectedView === 'totals' 
                  ? 'Rendimiento en todas las competiciones.' 
                  : `Rendimiento en ${stats?.byTournament?.[selectedView]?.tournamentName}.`}
              </CardDescription>
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

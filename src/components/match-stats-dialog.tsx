'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClipboardList, Star, Save } from 'lucide-react';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { collection, doc, getDoc, getDocs, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Player {
  id: string; // DNI
  name: string;
  lastName: string;
  dni: string;
}

interface MatchStatsDialogProps {
  tournamentId: string;
  match: { home: string; away: string };
  roundIndex: number;
  matchIndex: number;
  isFinished: boolean;
  suspensions: { [playerId: string]: { nextMatchSuspended: boolean } };
}

export function MatchStatsDialog({
  tournamentId,
  match,
  roundIndex,
  matchIndex,
  isFinished,
  suspensions
}: MatchStatsDialogProps) {
  const { toast } = useToast();
  const [homeRoster, setHomeRoster] = useState<Player[]>([]);
  const [awayRoster, setAwayRoster] = useState<Player[]>([]);
  const [mvp, setMvp] = useState<string | null>(null);
  const [stats, setStats] = useState<{ [playerId: string]: { goals: number, yellow: boolean, red: boolean } }>({});
  const [penaltyScore, setPenaltyScore] = useState<{ home: number | null, away: number | null }>({ home: null, away: null });
  
  const matchId = `r${roundIndex}m${matchIndex}`;

  useEffect(() => {
    const fetchInitialData = async () => {
        try {
            // Fetch rosters
            const teamsSnapshot = await getDocs(collection(db, 'tournaments', tournamentId, 'teams'));
            const teamsData = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const homeTeamDoc = teamsData.find(t => t.name === match.home);
            const awayTeamDoc = teamsData.find(t => t.name === match.away);

            if (homeTeamDoc) {
                const homeRosterSnap = await getDocs(collection(db, 'tournaments', tournamentId, 'teams', homeTeamDoc.id, 'roster'));
                setHomeRoster(homeRosterSnap.docs.map(doc => doc.data() as Player));
            }
            if (awayTeamDoc) {
                const awayRosterSnap = await getDocs(collection(db, 'tournaments', tournamentId, 'teams', awayTeamDoc.id, 'roster'));
                setAwayRoster(awayRosterSnap.docs.map(doc => doc.data() as Player));
            }
            
            // Fetch existing match stats
            const matchStatsRef = doc(db, 'tournaments', tournamentId, 'matches', matchId);
            const matchStatsSnap = await getDoc(matchStatsRef);
            if(matchStatsSnap.exists()){
                const data = matchStatsSnap.data();
                setMvp(data.mvp || null);
                setStats(data.stats || {});
                setPenaltyScore(data.penaltyScore || { home: null, away: null });
            }

        } catch (error) {
            console.error("Error fetching match dialog data: ", error);
        }
    };
    
    fetchInitialData();
  }, [tournamentId, match, matchId]);

  const handleStatChange = (playerId: string, stat: 'goals' | 'yellow' | 'red', value: any) => {
    if (!playerId || isFinished) return;
    setStats(prev => {
        const currentStats = prev[playerId] || { goals: 0, yellow: false, red: false };
        return {
            ...prev,
            [playerId]: {
                ...currentStats,
                [stat]: value
            }
        }
    });
  };

  const handleMvpChange = (playerId: string) => {
    if (!playerId || isFinished) return;
    setMvp(prev => prev === playerId ? null : playerId);
  }
  
  const handleSaveStats = async () => {
    const matchStatsRef = doc(db, 'tournaments', tournamentId, 'matches', matchId);
    const dataToSave = { mvp, stats, penaltyScore };
    try {
        await setDoc(matchStatsRef, dataToSave, { merge: true });
        toast({
            title: "¡Estadísticas Guardadas!",
            description: "Los datos del partido se han guardado correctamente.",
        })
    } catch (error) {
        console.error("Error saving match stats: ", error);
        toast({ title: "Error", description: "No se pudieron guardar las estadísticas.", variant: "destructive" });
    }
  }

  const renderPlayerStats = (player: Player | null, index: number, teamType: 'home' | 'away') => {
    const playerId = player?.dni;
    const isSuspended = playerId ? suspensions[playerId]?.nextMatchSuspended : false;
    const playerName = player ? `${player.name} ${player.lastName}` : `Jugador ${index + 1}`;
    const playerStats = playerId ? stats[playerId] || { goals: 0, yellow: false, red: false } : { goals: 0, yellow: false, red: false };

    return (
      <div key={playerId || `${teamType}-placeholder-${index}`} className="grid grid-cols-[30px_1fr_45px_30px_30px] items-center gap-x-2 py-1">
        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleMvpChange(playerId!)} disabled={!player || isFinished || isSuspended}>
            <Star className={cn("h-4 w-4 text-muted-foreground", mvp === playerId && "text-amber-400 fill-amber-400")} />
        </Button>
        <p className={cn("text-sm truncate", isSuspended && "text-destructive line-through")} title={playerName}>
            {playerName} {isSuspended && '(S)'}
        </p>
        <Input
          id={`goals-${playerId}`}
          type="number"
          min="0"
          className="h-7 w-12 text-center px-1"
          value={playerStats.goals || ''}
          onChange={(e) => handleStatChange(playerId!, 'goals', e.target.value ? Number(e.target.value) : 0)}
          disabled={!player || isFinished || isSuspended}
        />
        <Button 
              size="icon" 
              variant={playerStats.yellow ? 'default' : 'outline'}
              className={cn("h-6 w-6 p-0 border-amber-400", playerStats.yellow && "bg-amber-400 hover:bg-amber-500")}
              onClick={() => handleStatChange(playerId!, 'yellow', !playerStats.yellow)}
              disabled={!player || isFinished || isSuspended}
          >
              <div className="w-3 h-4 bg-current rounded-sm" />
          </Button>
           <Button 
              size="icon" 
              variant={playerStats.red ? 'default' : 'outline'}
              className={cn("h-6 w-6 p-0 border-red-600", playerStats.red && "bg-red-600 hover:bg-red-700")}
              onClick={() => handleStatChange(playerId!, 'red', !playerStats.red)}
              disabled={!player || isFinished || isSuspended}
           >
              <div className="w-3 h-4 bg-current rounded-sm" />
          </Button>
      </div>
    );
  };

  const renderTeamColumn = (roster: Player[], teamName: string, teamType: 'home' | 'away') => {
    const displayItems = Array.from({ length: 10 }, (_, i) => roster[i] || null);
    return (
        <div className="space-y-1">
             <h3 className="font-semibold mb-2 text-center">{teamName}</h3>
            <div className="grid grid-cols-[30px_1fr_45px_30px_30px] items-center gap-x-2 text-xs font-bold text-muted-foreground px-1">
                <span className="text-center">MVP</span>
                <span className="text-center">JUGADOR</span>
                <span className="text-center">G</span>
                <span className="text-center">A</span>
                <span className="text-center">R</span>
            </div>
            {displayItems.map((player, index) => renderPlayerStats(player, index, teamType))}
        </div>
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={isFinished}>
          <ClipboardList className="mr-2 h-4 w-4" />
          Estadísticas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl p-4">
        <DialogHeader>
            <DialogTitle>Estadísticas del Partido: {match.home} vs {match.away}</DialogTitle>
            <DialogDescription>
                Aquí puedes cargar los goles, tarjetas y jugador del partido (MVP). Los cambios se guardan al presionar 'Guardar'.
            </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 items-start gap-x-4 pt-4">
            {renderTeamColumn(homeRoster, match.home, 'home')}
            {renderTeamColumn(awayRoster, match.away, 'away')}
        </div>
        
        <Separator className="my-2" />

        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <h3 className="font-semibold text-sm">Torneo de Penales:</h3>
                <div className="flex items-center justify-center gap-2">
                     <span className="text-sm font-medium w-16 text-right truncate">{match.home}</span>
                    <Input type="number" min="0" className="w-12 h-8 text-center" placeholder="-" value={penaltyScore.home ?? ''} onChange={(e) => setPenaltyScore(p => ({...p, home: e.target.value === '' ? null : Number(e.target.value)}))} disabled={isFinished}/>
                    <span className="font-bold">-</span>
                    <Input type="number" min="0" className="w-12 h-8 text-center" placeholder="-" value={penaltyScore.away ?? ''} onChange={(e) => setPenaltyScore(p => ({...p, away: e.target.value === '' ? null : Number(e.target.value)}))} disabled={isFinished}/>
                    <span className="text-sm font-medium w-16 truncate">{match.away}</span>
                </div>
            </div>
            <div className="flex gap-2">
                 <DialogClose asChild>
                    <Button type="button" variant="secondary">Cerrar</Button>
                 </DialogClose>
                {!isFinished && (
                  <Button onClick={handleSaveStats}>
                    <Save className="mr-2 h-4 w-4"/> Guardar
                  </Button>
                )}
            </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}

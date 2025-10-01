'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue, update, remove, push, serverTimestamp } from 'firebase/database';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Loader2, PlusCircle, Save, Trash2, ShieldCheck, ShieldX } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  logoUrl: string;
  tournamentId: string;
}

interface Tournament {
  id: string;
  name: string;
  teamCount: number;
  teams?: { [key: string]: boolean };
}

export default function ManageTeamsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  
  const tournamentId = params.id as string;

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTeamName, setEditingTeamName] = useState({ id: '', name: '' });

  useEffect(() => {
    if (userLoading) return;
    if (!user || user.role !== 'admin') {
      router.push('/');
      return;
    }

    if (!tournamentId) return;

    const tournamentRef = ref(db, `tournaments/${tournamentId}`);
    const unsubscribeTournament = onValue(tournamentRef, (snapshot) => {
      if (snapshot.exists()) {
        setTournament({ id: snapshot.key, ...snapshot.val() });
      } else {
        toast({ title: "Error", description: "El torneo no fue encontrado.", variant: "destructive" });
        router.push('/admin/manage-tournaments');
      }
    }, (error) => {
      console.error(error);
      toast({ title: "Error de Conexión", description: "No se pudo acceder al torneo.", variant: "destructive" });
    });

    return () => unsubscribeTournament();
  }, [tournamentId, user, userLoading, router, toast]);

  useEffect(() => {
    if (!tournament) return;

    if (!tournament.teams) {
      setTeams([]);
      setLoading(false);
      return;
    }

    const teamIds = Object.keys(tournament.teams);
    const listeners: Function[] = [];

    const teamsData: { [id: string]: Team } = {};

    teamIds.forEach(teamId => {
        const teamRef = ref(db, `teams/${teamId}`);
        const listener = onValue(teamRef, (snapshot) => {
            if (snapshot.exists()) {
                teamsData[teamId] = { id: snapshot.key, ...snapshot.val() };
            } else {
                delete teamsData[teamId];
            }
            setTeams(Object.values(teamsData).sort((a, b) => a.name.localeCompare(b.name)));
        });
        listeners.push(listener);
    });
    
    setLoading(false);

    return () => {
      listeners.forEach(off => off());
    };

  }, [tournament]);

  const handleUpdateTeamName = async (teamId: string) => {
    const newName = editingTeamName.name.trim();
    const originalTeam = teams.find(t => t.id === teamId);

    if (!newName || newName === originalTeam?.name) {
        setEditingTeamName({ id: '', name: '' });
        return;
    }

    try {
      await update(ref(db), { 
          [`teams/${teamId}/name`]: newName,
          [`teams/${teamId}/logoUrl`]: `https://avatar.vercel.sh/${encodeURIComponent(newName)}.png` // Actualizar logo también
      });
      toast({ title: "Nombre Actualizado", description: `El equipo ahora se llama "${newName}".` });
      setEditingTeamName({ id: '', name: '' });
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "No se pudo actualizar el nombre.", variant: "destructive"});
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!tournament) return;

    try {
        const updates: { [key: string]: any } = {};
        updates[`/teams/${teamId}`] = null;
        updates[`/tournaments/${tournamentId}/teams/${teamId}`] = null;
        updates[`/tournaments/${tournamentId}/teamCount`] = (tournament.teamCount || 1) - 1;

        await update(ref(db), updates);

        toast({ title: "Equipo Eliminado", description: `"${teamName}" fue eliminado del torneo.`});
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudo eliminar el equipo.", variant: "destructive"});
    }
  };

  const handleAddTeam = async () => {
    if (!newTeamName.trim() || !tournament) return;

    setIsAdding(true);
    try {
        const updates: { [key: string]: any } = {};
        const newTeamRef = push(ref(db, 'teams'));
        const newTeamId = newTeamRef.key;

        if (!newTeamId) throw new Error("No se pudo generar ID para el equipo");

        updates[`/teams/${newTeamId}`] = {
            id: newTeamId,
            name: newTeamName,
            logoUrl: `https://avatar.vercel.sh/${encodeURIComponent(newTeamName)}.png`,
            tournamentId: tournamentId,
            createdAt: serverTimestamp(),
        };
        updates[`/tournaments/${tournamentId}/teams/${newTeamId}`] = true;
        updates[`/tournaments/${tournamentId}/teamCount`] = (tournament.teamCount || 0) + 1;

        await update(ref(db), updates);
        toast({ title: "Equipo Añadido", description: `"${newTeamName}" fue inscrito en el torneo.`});
        setNewTeamName('');
    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "No se pudo añadir el equipo.", variant: "destructive"});
    } finally {
        setIsAdding(false);
    }
  };

  if (loading || userLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /><span>Cargando gestión de equipos...</span></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
            <Link href="/admin/manage-tournaments">
                <Button variant="outline" className="mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a Torneos
                </Button>
            </Link>
            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-2xl">Gestionar Equipos</CardTitle>
                    <CardDescription>Torneo: <span className="font-semibold text-primary">{tournament?.name}</span></CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {teams.map(team => (
                            <div key={team.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                                <Avatar className="h-10 w-10 border">
                                    <AvatarImage src={team.logoUrl} alt={team.name} />
                                    <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                
                                {editingTeamName.id === team.id ? (
                                    <Input 
                                        value={editingTeamName.name}
                                        onChange={(e) => setEditingTeamName({ ...editingTeamName, name: e.target.value })}
                                        onBlur={() => handleUpdateTeamName(team.id)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateTeamName(team.id)}
                                        autoFocus
                                        className="flex-grow bg-background"
                                    />
                                ) : (
                                    <p className="flex-grow font-medium cursor-pointer" onClick={() => setEditingTeamName({ id: team.id, name: team.name })}>{team.name}</p>
                                )}

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar a "{team.name}"?</AlertDialogTitle>
                                            <AlertDialogDescription>Esta acción es permanente. El equipo será desvinculado de este torneo. Sus estadísticas históricas (si las tuviera) no se verán afectadas.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteTeam(team.id, team.name)}>Sí, eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                        {!loading && teams.length === 0 && (
                            <p className="text-center text-muted-foreground py-6">Este torneo aún no tiene equipos inscritos.</p>
                        )}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-3">Inscribir Nuevo Equipo</h3>
                        <div className="flex items-center gap-3">
                            <Input 
                                placeholder="Nombre del nuevo equipo"
                                value={newTeamName}
                                onChange={e => setNewTeamName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddTeam()}
                            />
                            <Button onClick={handleAddTeam} disabled={isAdding || !newTeamName.trim()}>
                                {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                Inscribir
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

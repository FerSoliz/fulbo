'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { ref, onValue, update, push, serverTimestamp, remove } from 'firebase/database';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

// --- UI Components ---
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, ShieldCheck, Trash2, Users } from 'lucide-react';

// --- Custom Components & Logic ---
import { TeamSearch } from '@/components/search/TeamSearch';
import { assignTeamToTournament, TeamSummary } from '@/lib/firebase/db';

// --- Type Definitions ---
interface Team {
  id: string;
  name: string;
  logoUrl: string;
}

interface Tournament {
  id: string;
  name: string;
  teamCount: number;
  size?: number; // Capacidad máxima del torneo
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
    if (user && user.role !== 'admin') router.push('/');
    if (!tournamentId) return;

    const tournamentRef = ref(db, `tournaments/${tournamentId}`);
    const unsubscribe = onValue(tournamentRef, (snapshot) => {
      if (snapshot.exists()) {
        setTournament({ id: snapshot.key, ...snapshot.val() });
      } else {
        toast({ title: "Error", description: "Torneo no encontrado.", variant: "destructive" });
        router.push('/admin/manage-tournaments');
      }
    });
    return () => unsubscribe();
  }, [tournamentId, user, userLoading, router, toast]);

  useEffect(() => {
    if (!tournament) return;
    setLoading(true);
    if (!tournament.teams) {
      setTeams([]);
      setLoading(false);
      return;
    }

    const teamIds = Object.keys(tournament.teams);
    const teamPromises = teamIds.map(teamId => {
        return new Promise<Team | null>(resolve => {
            const teamRef = ref(db, `teams/${teamId}`);
            onValue(teamRef, (snapshot) => {
                resolve(snapshot.exists() ? { id: snapshot.key, ...snapshot.val() } : null);
            }, { onlyOnce: true });
        });
    });

    Promise.all(teamPromises).then(results => {
        setTeams(results.filter(Boolean).sort((a, b) => a!.name.localeCompare(b!.name)) as Team[]);
        setLoading(false);
    });

  }, [tournament]);

  const excludedTeamIds = useMemo(() => teams.map(t => t.id), [teams]);
  const isFull = useMemo(() => {
    if (!tournament || !tournament.size) return false;
    return (tournament.teamCount || 0) >= tournament.size;
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
          [`teams/${teamId}/logoUrl`]: `https://avatar.vercel.sh/${encodeURIComponent(newName)}.png`
      });
      toast({ title: "Nombre Actualizado", description: `El equipo ahora se llama "${newName}".` });
      setEditingTeamName({ id: '', name: '' });
    } catch (error) {
      console.error(error); toast({ title: "Error", description: "No se pudo actualizar el nombre.", variant: "destructive"});
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!tournament) return;
    try {
        const updates: { [key: string]: any } = {};
        updates[`/teams/${teamId}/tournamentId`] = null;
        updates[`/tournaments/${tournamentId}/teams/${teamId}`] = null;
        updates[`/tournaments/${tournamentId}/teamCount`] = (tournament.teamCount || 1) - 1;
        await update(ref(db), updates);
        // Manually filter out the team from the local state to avoid waiting for useEffect
        setTeams(prevTeams => prevTeams.filter(t => t.id !== teamId));
        toast({ title: "Equipo Desvinculado", description: `"${teamName}" fue eliminado del torneo.`});
    } catch (error) {
        console.error(error); toast({ title: "Error", description: "No se pudo eliminar el equipo.", variant: "destructive"});
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim() || !tournament) return;
    if (isFull) {
        toast({ title: "Torneo Lleno", description: "No se puede crear e inscribir más equipos.", variant: "destructive"});
        return;
    }
    setIsAdding(true);
    try {
        const updates: { [key: string]: any } = {};
        const newTeamRef = push(ref(db, 'teams'));
        const newTeamId = newTeamRef.key;
        if (!newTeamId) throw new Error("No se pudo generar ID para el equipo");

        const newTeamData = { id: newTeamId, name: newTeamName, logoUrl: `https://avatar.vercel.sh/${encodeURIComponent(newTeamName)}.png`, tournamentId: tournamentId, createdAt: serverTimestamp() };
        updates[`/teams/${newTeamId}`] = newTeamData;
        updates[`/tournaments/${tournamentId}/teams/${newTeamId}`] = true;
        updates[`/tournaments/${tournamentId}/teamCount`] = (tournament.teamCount || 0) + 1;

        await update(ref(db), updates);
        setTeams(prev => [...prev, newTeamData].sort((a,b) => a.name.localeCompare(b.name)));
        toast({ title: "Equipo Creado", description: `"${newTeamName}" fue creado e inscrito.`});
        setNewTeamName('');
    } catch (error) {
        console.error(error); toast({ title: "Error", description: "No se pudo crear el equipo.", variant: "destructive"});
    } finally {
        setIsAdding(false);
    }
  };

  const handleAssignTeam = async (team: TeamSummary) => {
    if (!tournament) return;
    if (isFull) {
        toast({ title: "Torneo Lleno", description: "No se pueden inscribir más equipos.", variant: "destructive"});
        return;
    }
    setIsAdding(true);
    try {
        const success = await assignTeamToTournament(team.id, tournamentId);
        if (success) {
            setTeams(prev => [...prev, {id: team.id, name: team.name, logoUrl: team.logoUrl}].sort((a,b) => a.name.localeCompare(b.name)));
            toast({ title: "Equipo Inscrito", description: `"${team.name}" fue añadido al torneo.` });
        } else {
            throw new Error("La función de asignación retornó false.");
        }
    } catch (error) {
        console.error("Error al asignar equipo:", error);
        toast({ title: "Error", description: "No se pudo inscribir el equipo.", variant: "destructive" });
    } finally {
        setIsAdding(false);
    }
  };

  if (loading || userLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /><span>Cargando...</span></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
            <Link href="/admin/manage-tournaments"><Button variant="outline" className="mb-6"><ArrowLeft className="mr-2 h-4 w-4" />Volver a Torneos</Button></Link>
            <Card className="overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-2xl">Gestionar Equipos</CardTitle>
                    <CardDescription>Torneo: <span className="font-semibold text-primary">{tournament?.name}</span></CardDescription>
                    {tournament?.size != null && (
                        <div className="flex items-center text-sm text-muted-foreground pt-2 gap-2">
                            <Users className="h-4 w-4" />
                            <span className="font-bold text-base">{teams.length}</span> / <span className="font-bold text-base">{tournament.size}</span>
                            <span>equipos inscritos. {isFull && <span className='font-semibold text-destructive'>(Torneo Lleno)</span>}</span>
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {teams.map(team => (
                            <div key={team.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-muted/50 transition-colors">
                                <Avatar className="h-10 w-10 border"><AvatarImage src={team.logoUrl} alt={team.name} /><AvatarFallback>{team.name.charAt(0)}</AvatarFallback></Avatar>
                                {editingTeamName.id === team.id ? (
                                    <Input value={editingTeamName.name} onChange={(e) => setEditingTeamName({ ...editingTeamName, name: e.target.value })} onBlur={() => handleUpdateTeamName(team.id)} onKeyDown={(e) => e.key === 'Enter' && handleUpdateTeamName(team.id)} autoFocus className="flex-grow bg-background"/>
                                ) : (
                                    <p className="flex-grow font-medium cursor-pointer" onClick={() => setEditingTeamName({ id: team.id, name: team.name })}>{team.name}</p>
                                )}
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Desvincular a "{team.name}"?</AlertDialogTitle>
                                            <AlertDialogDescription>Esta acción quitará al equipo de este torneo, pero NO lo eliminará del sistema. Podrá ser inscrito en otros torneos.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={() => handleDeleteTeam(team.id, team.name)}>Sí, desvincular</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        ))}
                        {!loading && teams.length === 0 && <p className="text-center text-muted-foreground py-6">Este torneo aún no tiene equipos.</p>}
                    </div>
                    
                    <div className="mt-8 pt-6 border-t">
                        <h3 className="text-lg font-semibold mb-4">Añadir Equipos al Torneo</h3>
                        {isFull ? (
                            <div className="text-center p-4 bg-muted/70 rounded-lg">
                                <p className="font-semibold text-destructive">Este torneo ha alcanzado su capacidad máxima.</p>
                            </div>
                        ) : (
                            <Tabs defaultValue="existing">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="existing">Añadir Existente</TabsTrigger>
                                    <TabsTrigger value="new">Crear Nuevo</TabsTrigger>
                                </TabsList>
                                <TabsContent value="existing" className="pt-4">
                                    <TeamSearch onTeamSelected={handleAssignTeam} excludedTeamIds={excludedTeamIds} disabled={isAdding} />
                                </TabsContent>
                                <TabsContent value="new" className="pt-4">
                                    <div className="flex items-center gap-3">
                                        <Input placeholder="Nombre del nuevo equipo" value={newTeamName} onChange={e => setNewTeamName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateTeam()} disabled={isAdding} />
                                        <Button onClick={handleCreateTeam} disabled={isAdding || !newTeamName.trim()}>
                                            {isAdding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                                            Crear e Inscribir
                                        </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

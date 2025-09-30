'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Trash2,
  Calendar,
  Users,
  Pen,
  Check,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { rtdb, ref, onValue, remove, update } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';

// Modelo de datos para un Torneo en Realtime Database
interface Tournament {
  id: string;
  name: string;
  description?: string;
  logoUrl?: string;
  startDate: string;
  status: 'upcoming' | 'ongoing' | 'finished';
  type: string;
  format: string;
  teamCount: number;
}

export default function ManageTournamentsPage() {
  const router = useRouter();
  const { user } = useUser(); // Para proteger la ruta
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Protección de la ruta para que solo accedan los admins
  useEffect(() => {
    if (user === null) router.push('/'); // Redirige si no está logueado
    if (user && user.role !== 'admin') router.push('/'); // Redirige si no es admin
  }, [user, router]);

  // Leer torneos de Realtime Database
  useEffect(() => {
    const tournamentsRef = ref(rtdb, 'tournaments');
    const unsubscribe = onValue(tournamentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tournamentsList: Tournament[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setTournaments(tournamentsList.sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()));
      } else {
        setTournaments([]);
      }
      setLoading(false);
    }, (error) => {
        console.error("Error al cargar torneos desde RTDB: ", error);
        toast({ title: "Error de Conexión", description: "No se pudieron obtener los torneos.", variant: "destructive" });
        setLoading(false);
    });

    // Limpiar el listener al desmontar el componente
    return () => unsubscribe();
  }, [toast]);

  useEffect(() => {
    if (editingTournamentId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingTournamentId]);

  // Eliminar torneo en Realtime Database
  const handleDeleteTournament = async (tournamentId: string) => {
    try {
        const tournamentRef = ref(rtdb, `tournaments/${tournamentId}`);
        await remove(tournamentRef);
        toast({ title: "Torneo eliminado", description: "El torneo ha sido eliminado permanentemente." });
    } catch (error) {
        console.error("Error al eliminar torneo de RTDB: ", error);
         toast({ title: "Error al eliminar", description: "Hubo un problema al eliminar el torneo.", variant: "destructive" });
    }
  };

  const handleEditClick = (tournament: Tournament) => {
    setEditingTournamentId(tournament.id);
    setEditingName(tournament.name);
  };

  // Actualizar nombre del torneo en Realtime Database
  const handleSaveName = async (tournamentId: string) => {
    const originalName = tournaments.find(t => t.id === tournamentId)?.name;
    if (originalName === editingName.trim() || editingName.trim() === '') {
        setEditingTournamentId(null);
        return;
    }

    try {
        const tournamentRef = ref(rtdb, `tournaments/${tournamentId}`);
        await update(tournamentRef, { name: editingName });
        toast({ title: "Nombre actualizado", description: "El nombre del torneo se ha guardado." });
    } catch (error) {
        console.error("Error al actualizar nombre en RTDB: ", error);
        toast({ title: "Error al guardar", description: "No se pudo actualizar el nombre del torneo.", variant: "destructive" });
    } finally {
        setEditingTournamentId(null);
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, tournamentId: string) => {
    if (e.key === 'Enter') handleSaveName(tournamentId);
    if (e.key === 'Escape') setEditingTournamentId(null);
  };
  
  if (!user || user.role !== 'admin') {
      return <div className="p-8 text-center">Acceso denegado. Redirigiendo...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Administrar Torneos</CardTitle>
            <CardDescription>
              Gestiona, edita o elimina los torneos existentes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
                 <div className="flex justify-center items-center py-10">
                    <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                    <span>Cargando torneos...</span>
                </div>
            ) : tournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournaments.map((tournament) => (
                  <Card key={tournament.id} className="flex flex-col">
                    <CardHeader>
                      {editingTournamentId === tournament.id ? (
                        <div className="flex items-center gap-2">
                          <Input
                            ref={inputRef}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => handleInputKeyDown(e, tournament.id)}
                            onBlur={() => handleSaveName(tournament.id)}
                            className="text-lg font-bold"
                          />
                          <Button size="icon" onClick={() => handleSaveName(tournament.id)}><Check className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <CardTitle className="cursor-pointer hover:text-accent" onClick={() => handleEditClick(tournament)}>{tournament.name}</CardTitle>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(tournament)}><Pen className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará permanentemente el torneo.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTournament(tournament.id)}>Eliminar</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                      <CardDescription>{tournament.type} - {tournament.format}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Equipos: {tournament.teamCount}</p>
                       <p className="text-sm text-muted-foreground">Inicio: {new Date(tournament.startDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                       <p className={cn("text-sm font-semibold", tournament.status === 'ongoing' && "text-green-500", tournament.status === 'finished' && "text-red-500")}>Estado: {tournament.status}</p>
                    </CardContent>
                    <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button asChild variant="outline"><Link href={`/admin/tournaments/${tournament.id}`}><Calendar className="mr-2 h-4 w-4" />VER FIXTURE</Link></Button>
                      <Button asChild><Link href={`/admin/tournaments/${tournament.id}/teams`}><Users className="mr-2 h-4 w-4" />EDITAR EQUIPOS</Link></Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No hay torneos creados todavía.</p>
                <Link href="/admin/create-competition"><Button variant="link" className="mt-2">Crear el primero</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

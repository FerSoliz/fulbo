'use client';

import { useState, useEffect } from 'react';
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
  Loader2,
  Settings,
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
import { cn } from '@/lib/utils';
// --- CORRECCIÓN DE IMPORTACIONES --- 
// Se importa `db` desde la configuración principal de firebase y las funciones específicas desde `firebase/database`.
import { db } from '@/lib/firebase';
import { ref, onValue, update } from 'firebase/database';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { canAccessAdminPanel } from '@/lib/auth/roles';

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
  const { user } = useUser();
  const { toast } = useToast();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user === null) router.push('/');
    if (user && !canAccessAdminPanel(user)) router.push('/');
  }, [user, router]);

  useEffect(() => {
    // Se utiliza `db` (la instancia importada) en lugar de `rtdb`.
    const tournamentsRef = ref(db, 'tournaments');
    const unsubscribe = onValue(tournamentsRef, (snapshot) => {
      const data = snapshot.val();
      const tournamentsList: Tournament[] = data 
        ? Object.keys(data).map(key => ({ id: key, ...data[key] })) 
        : [];
      setTournaments(tournamentsList.sort((a, b) => new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()));
      setLoading(false);
    }, (error) => {
        console.error("Error al cargar torneos desde RTDB: ", error);
        toast({ title: "Error de Conexión", description: "No se pudieron obtener los torneos.", variant: "destructive" });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handleDeleteTournament = async (tournamentId: string) => {
    const updates: { [key: string]: null } = {};
    updates[`/tournaments/${tournamentId}`] = null;
    
    try {
      // Se utiliza `db` aquí también.
      await update(ref(db), updates);
      toast({ title: "Torneo Eliminado", description: "El torneo ha sido eliminado." });
    } catch (error) {
      console.error("Error en la eliminación: ", error);
      toast({ title: "Error al eliminar", description: "Hubo un problema al eliminar el torneo.", variant: "destructive" });
    }
  };

  if (!user || !canAccessAdminPanel(user)) {
      return <div className="p-8 text-center">Acceso denegado. Redirigiendo...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin">
          {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
          }
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Administrar Torneos</CardTitle>
            <CardDescription>Gestiona, edita o elimina los torneos existentes.</CardDescription>
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
                      <div className="flex items-start justify-between">
                          <CardTitle>{tournament.name}</CardTitle>
                          <div className="flex items-center gap-1 -mt-2 -mr-2">
                              <Button asChild variant="ghost" size="icon">
                                  <Link href={`/admin/tournaments/${tournament.id}/edit`}>
                                    {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                                    }
                                    <Pen className="h-4 w-4 text-muted-foreground" />
                                  </Link>
                              </Button>
                              <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                      <AlertDialogHeader>
                                          <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                                          <AlertDialogDescription>Esta acción eliminará la entrada del torneo. No eliminará equipos, partidos o estadísticas asociadas.</AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                          <AlertDialogAction className="bg-destructive hover:bg-destructive/80" onClick={() => handleDeleteTournament(tournament.id)}>Sí, eliminar torneo</AlertDialogAction>
                                      </AlertDialogFooter>
                                  </AlertDialogContent>
                              </AlertDialog>
                          </div>
                      </div>
                      <CardDescription>{tournament.type} - {tournament.format}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                       <p className="text-sm text-muted-foreground">Equipos: {tournament.teamCount}</p>
                       <p className="text-sm text-muted-foreground">Inicio: {new Date(tournament.startDate).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                       <p className={cn("text-sm font-semibold", tournament.status === 'ongoing' && "text-green-500", tournament.status === 'finished' && "text-red-500")}>Estado: {tournament.status}</p>
                    </CardContent>
                    <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button asChild variant="outline"><Link href={`/admin/tournaments/${tournament.id}`}>
                        {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                        }<Calendar className="mr-2 h-4 w-4" />VER FIXTURE</Link></Button>
                      <Button asChild><Link href={`/admin/tournaments/${tournament.id}/teams`}>
                        {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                        }<Users className="mr-2 h-4 w-4" />EDITAR EQUIPOS</Link></Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">No hay torneos creados todavía.</p>
                <Link href="/admin/create-competition">
                  {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                  }<Button variant="link" className="mt-2">Crear el primero</Button></Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

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
  Settings,
  Trash2,
  Calendar,
  Users,
  Pen,
  Check,
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

interface Tournament {
  id: string;
  name: string;
  type: string;
  format: string;
  teamCount: number;
  groupCount?: number;
}

export default function ManageTournamentsPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [editingTournamentId, setEditingTournamentId] = useState<string | null>(
    null
  );
  const [editingName, setEditingName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedTournaments = JSON.parse(
      localStorage.getItem('tournaments') || '[]'
    );
    setTournaments(savedTournaments);
  }, []);

  useEffect(() => {
    if (editingTournamentId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingTournamentId]);

  const handleDeleteTournament = (tournamentId: string) => {
    const updatedTournaments = tournaments.filter((t) => t.id !== tournamentId);
    setTournaments(updatedTournaments);
    localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    // Also remove associated teams
    localStorage.removeItem(`teams_${tournamentId}`);
  };

  const handleEditClick = (tournament: Tournament) => {
    setEditingTournamentId(tournament.id);
    setEditingName(tournament.name);
  };

  const handleSaveName = (tournamentId: string) => {
    const updatedTournaments = tournaments.map((t) =>
      t.id === tournamentId ? { ...t, name: editingName } : t
    );
    setTournaments(updatedTournaments);
    localStorage.setItem('tournaments', JSON.stringify(updatedTournaments));
    setEditingTournamentId(null);
  };

  const handleInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    tournamentId: string
  ) => {
    if (e.key === 'Enter') {
      handleSaveName(tournamentId);
    }
    if (e.key === 'Escape') {
      setEditingTournamentId(null);
    }
  };

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
            {tournaments.length > 0 ? (
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
                            onKeyDown={(e) =>
                              handleInputKeyDown(e, tournament.id)
                            }
                            onBlur={() => handleSaveName(tournament.id)}
                            className="text-lg font-bold"
                          />
                          <Button
                            size="icon"
                            onClick={() => handleSaveName(tournament.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <CardTitle
                            className="cursor-pointer hover:text-accent"
                            onClick={() => handleEditClick(tournament)}
                          >
                            {tournament.name}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(tournament)}
                            >
                              <Pen className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="icon">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Estás seguro?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se
                                    eliminará permanentemente el torneo y todos
                                    sus datos asociados.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteTournament(tournament.id)
                                    }
                                  >
                                    Eliminar
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      )}
                      <CardDescription>
                        {tournament.type} - {tournament.format}
                        {tournament.groupCount && ` - ${tournament.groupCount} Grupos`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm text-muted-foreground">
                        Equipos: {tournament.teamCount}
                      </p>
                    </CardContent>
                    <CardFooter className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Button asChild variant="outline">
                        <Link
                          href={`/admin/tournaments/${tournament.id}`}
                          className={cn(
                            !tournament.id &&
                              'pointer-events-none opacity-50'
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          VER FIXTURE
                        </Link>
                      </Button>
                      <Button asChild>
                        <Link
                          href={`/admin/tournaments/${tournament.id}/teams`}
                          className={cn(
                            !tournament.id &&
                              'pointer-events-none opacity-50'
                          )}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          GESTIONAR EQUIPOS
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  No hay torneos creados todavía.
                </p>
                <Link href="/admin/create-competition">
                  <Button variant="link" className="mt-2">
                    Crear el primero
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

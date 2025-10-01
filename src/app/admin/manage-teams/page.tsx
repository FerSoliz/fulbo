'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
// --- CORRECCIÓN DE IMPORTACIONES ---
// Cambiamos la importación de `rtdb` a `db` para que coincida con el archivo de configuración.
import { db, storage } from '@/lib/firebase';
import { ref as dbRef, onValue, remove } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';

import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';

import { UpsertTeamDialog } from '@/components/upsert-team-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'; 

import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, PlusCircle, Users, ShieldAlert, XCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  logoUrl?: string;
}

type PageState = 'LOADING' | 'ACCESS_DENIED' | 'EMPTY' | 'READY';

export default function ManageTeamsPage() {
  const { user, loading: userLoading } = useUser();
  const { toast } = useToast();
  const [pageState, setPageState] = useState<PageState>('LOADING');
  const [teams, setTeams] = useState<Team[]>([]);
  
  const [isUpsertDialogOpen, setIsUpsertDialogOpen] = useState(false);
  const [teamToEdit, setTeamToEdit] = useState<Team | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (userLoading) {
      setPageState('LOADING');
      return;
    }
    if (!user || user.role !== 'admin') {
      setPageState('ACCESS_DENIED');
      return;
    }

    // Usamos `db` en lugar de `rtdb`.
    const teamsRef = dbRef(db, 'teams');
    const unsubscribe = onValue(teamsRef, (snapshot) => {
      if (snapshot.exists()) {
        const teamsData = snapshot.val();
        const teamsList: Team[] = Object.keys(teamsData).map(key => ({ id: key, ...teamsData[key] }));
        setTeams(teamsList);
        setPageState('READY');
      } else {
        setTeams([]);
        setPageState('EMPTY');
      }
    }, (error) => {
        console.error("Firebase read failed: ", error);
        setPageState('ACCESS_DENIED');
    });

    return () => unsubscribe();
  }, [user, userLoading]);
  
  const handleOpenCreateDialog = () => {
    setTeamToEdit(null);
    setIsUpsertDialogOpen(true);
  };

  const handleOpenEditDialog = (team: Team) => {
    setTeamToEdit(team);
    setIsUpsertDialogOpen(true);
  };
  
  const handleUpsertDialogSuccess = () => {
    setIsUpsertDialogOpen(false);
    setTeamToEdit(null);
  };

  const handleOpenDeleteDialog = (team: Team) => {
    setTeamToDelete(team);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;
    setIsDeleting(true);
    try {
      if (teamToDelete.logoUrl) {
        const logoStorageRef = storageRef(storage, `team-logos/${teamToDelete.id}`);
        await deleteObject(logoStorageRef);
      }
      // Usamos `db` en lugar de `rtdb`.
      await remove(dbRef(db, `teams/${teamToDelete.id}`));

      toast({
        title: "¡Equipo eliminado!",
        description: `El equipo "${teamToDelete.name}" ha sido eliminado correctamente.`,
      });

    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            console.warn("El logo no se encontró en Storage, pero se procederá a borrar de la base de datos.");
            await remove(dbRef(db, `teams/${teamToDelete.id}`)); // Usamos `db`
            toast({ title: "Equipo eliminado (con advertencia)", description: "Se borraron los datos, aunque el logo no se encontró en el almacenamiento."});
        } else {
            console.error("Error al eliminar el equipo:", error);
            toast({ title: "Error", description: "No se pudo eliminar el equipo.", variant: "destructive" });
        }
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
      setTeamToDelete(null);
    }
  };
  
  const renderContent = () => {
    switch (pageState) {
        case 'LOADING':
          return <div className="flex items-center justify-center py-16"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="ml-4 text-lg">Cargando equipos...</p></div>;
        case 'ACCESS_DENIED':
          return <div className="flex flex-col items-center justify-center py-16 text-center"><ShieldAlert className="h-16 w-16 text-destructive mb-4" /><h2 className="text-2xl font-bold">Acceso Denegado</h2><p className="text-muted-foreground mt-2">No tienes los permisos necesarios para ver esta página.</p></div>;
        case 'EMPTY':
          return <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg"><Users className="h-16 w-16 text-muted-foreground mb-4" /><h2 className="text-2xl font-bold">No hay equipos</h2><p className="text-muted-foreground mt-2">Parece que aún no se ha creado ningún equipo. ¡Crea el primero!</p></div>;
        case 'READY':
          return (
            <div className="border rounded-lg">
              <Table>
                <TableHeader><TableRow><TableHead className="w-[80px]">Logo</TableHead><TableHead>Nombre del Equipo</TableHead><TableHead className="text-right w-[100px]">Acciones</TableHead></TableRow></TableHeader>
                <TableBody>
                  {teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell><Avatar><AvatarImage src={team.logoUrl} alt={`Logo de ${team.name}`} /><AvatarFallback>{team.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar></TableCell>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menú</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/teams/${team.id}`}>
                                <Users className="mr-2 h-4 w-4" />
                                Gestionar Plantilla
                              </Link>
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={() => handleOpenEditDialog(team)}><Edit className="mr-2 h-4 w-4" />Editar Equipo</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleOpenDeleteDialog(team)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" />Eliminar</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          );
        default:
          return <div className="flex flex-col items-center justify-center py-16 text-center"><XCircle className="h-16 w-16 text-destructive mb-4" /><h2 className="text-2xl font-bold">Error Inesperado</h2><p className="text-muted-foreground mt-2">Algo salió mal. Por favor, intenta recargar la página.</p></div>;
      }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mt-6 mb-8">
        <Button onClick={handleOpenCreateDialog} disabled={pageState !== 'READY' && pageState !== 'EMPTY'}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nuevo Equipo
        </Button>
      </div>
      {renderContent()}
      
      <UpsertTeamDialog 
        open={isUpsertDialogOpen}
        onOpenChange={setIsUpsertDialogOpen}
        teamToEdit={teamToEdit}
        onSuccess={handleUpsertDialogSuccess}
      />

      <ConfirmDeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title={`¿Eliminar "${teamToDelete?.name}"?`}
        description="Esta acción es permanente y no se puede deshacer. Se borrará el equipo y su logo."
        isLoading={isDeleting}
      />
    </div>
  );
}

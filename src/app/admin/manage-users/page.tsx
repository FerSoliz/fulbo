'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
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
import {
  ArrowLeft,
  MoreHorizontal,
  ShieldAlert,
  UserX,
  UserCheck,
  Trash2,
  Shield,
  Pencil,
  Search,
} from 'lucide-react';
import { useUser } from '@/context/user-context';
import type { User } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/firebase';
import { ref, onValue, update, remove } from 'firebase/database';

export default function ManageUsersPage() {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const usersList: User[] = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setUsers(usersList);
      } else {
        setUsers([]);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users: ", error);
      toast({ title: "Error de Carga", description: "No se pudo obtener la lista de usuarios.", variant: "destructive" });
      setLoading(false);
    });

    // Limpiar la suscripción al desmontar el componente
    return () => unsubscribe();
  }, [toast]);

  const saveUserUpdate = async (updatedUser: Partial<User> & { id: string }) => {
    try {
        const userRef = ref(db, `users/${updatedUser.id}`);
        await update(userRef, updatedUser);
        // El listener onValue actualizará el estado automáticamente, no es necesario un `setUsers` manual.
    } catch (error) {
        console.error("Error actualizando usuario en RTDB: ", error);
        toast({ title: "Error", description: "No se pudo actualizar el usuario.", variant: "destructive" });
    }
  };

  const handleToggleBlock = (userId: string) => {
    const userToUpdate = users.find((u) => u.id === userId);
    if (!userToUpdate) return;
    const updatedUser = { id: userId, isBlocked: !userToUpdate.isBlocked };
    saveUserUpdate(updatedUser);
    toast({
      title: `Usuario ${updatedUser.isBlocked ? 'bloqueado' : 'desbloqueado'}`,
    });
  };

  const handleChangeRole = (userId: string, newRole: 'player' | 'captain' | 'admin') => {
    const userToUpdate = users.find((u) => u.id === userId);
    if (!userToUpdate) return;
    const updatedUser = { id: userId, role: newRole };
    saveUserUpdate(updatedUser);
    toast({
      title: 'Rol actualizado',
      description: `El usuario ahora tiene el rol de ${newRole}.`,
    });
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const userRef = ref(db, `users/${userId}`);
      await remove(userRef);
      // El listener onValue actualizará el estado automáticamente.
      toast({
        title: 'Usuario Eliminado',
        description: 'El usuario ha sido eliminado permanentemente.',
        variant: 'destructive',
      });
    } catch (error) {
       console.error("Error eliminando usuario de RTDB: ", error);
       toast({ title: "Error", description: "No se pudo eliminar el usuario.", variant: "destructive" });
    }
  };
  
  // Se usa el estado local `users` que está garantizado que es un array
  const filteredUsers = (users || []).filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="p-8 text-center">Cargando usuarios...</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/admin">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Administrar Usuarios</CardTitle>
            <CardDescription>
              Gestiona los usuarios, sus roles y estado en la plataforma.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className={cn(user.isBlocked && 'bg-destructive/10')}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} alt={user.name} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.role === 'admin'
                              ? 'destructive'
                              : user.role === 'captain'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {user.isBlocked ? (
                          <Badge variant="destructive">Bloqueado</Badge>
                        ) : (
                          <Badge variant="default" className="bg-green-500">Activo</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={currentUser ? user.id === currentUser.id : false}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleToggleBlock(user.id)}>
                              {user.isBlocked ? (
                                <UserCheck className="mr-2 h-4 w-4" />
                              ) : (
                                <UserX className="mr-2 h-4 w-4" />
                              )}
                              {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                            </DropdownMenuItem>
                            
                            <DropdownMenuSub>
                                <DropdownMenuSubTrigger>
                                     <Pencil className="mr-2 h-4 w-4" /> Cambiar Rol
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'player')}>
                                        <Shield className="mr-2 h-4 w-4" /> Player
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'captain')}>
                                        <Pencil className="mr-2 h-4 w-4" /> Captain
                                    </DropdownMenuItem>
                                     <DropdownMenuItem onClick={() => handleChangeRole(user.id, 'admin')}>
                                        <ShieldAlert className="mr-2 h-4 w-4" /> Admin
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSub>

                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Eliminar
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    ¿Estás seguro de eliminar a {user.name}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminarán permanentemente los datos del usuario.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteUser(user.id)}>
                                    Sí, eliminar usuario
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredUsers.length === 0 && !loading && (
                 <div className="text-center p-8 text-muted-foreground">
                    <p>No se encontraron usuarios con ese criterio de búsqueda.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

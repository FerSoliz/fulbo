'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { AnimatedAvatar } from '@/components/ui/animated-avatar';
import { DivisionBadge } from '@/components/ui/division-badge';
import {
  User,
  initialUsers,
  PlayerDetails,
  sudpointConfig,
  leagues,
} from '@/lib/data';
import {
  Medal,
  Shield,
  Swords,
  ShieldAlert,
  Calendar,
  Trophy,
  Link2,
  Star,
  Loader2,
  MessageSquare,
  Clock,
  UserCircle,
  Foot,
  Goal,
  MoreVertical,
  Pencil,
  Image as ImageIcon,
  Gift,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipProvider,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';
import { motion, AnimatePresence } from 'framer-motion';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  getDoc,
  collectionGroup,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

const EditProfileDialog = ({
  user,
  onSave,
  children,
}: {
  user: User;
  onSave: (updatedUser: User) => void;
  children: React.ReactNode;
}) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [dni, setDni] = useState(user.dni || '');

  useEffect(() => {
    setName(user.name);
    setUsername(user.username);
    setDni(user.dni || '');
  }, [user]);

  const handleSave = () => {
    const updatedUser = {
      ...user,
      name,
      username,
      dni,
    };
    onSave(updatedUser);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil y Vinculación</DialogTitle>
          <DialogDescription>
            Actualiza tu información personal. Tu DNI se usará para vincular
            tus estadísticas de jugador.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre y Apellido</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de Usuario</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dni">DNI (para vincular estadísticas)</Label>
            <Input
              id="dni"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (no editable)</Label>
            <Input id="email" value={user.email || ''} disabled />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" onClick={handleSave}>
              Guardar Cambios
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { toast } = useToast();
  const {
    user: currentUser,
    setUser: setCurrentUser,
    allUsers,
    setAllUsers,
    loading: userLoading,
  } = useUser();
  const { uploadFile, isUploading, progress } = useUpload();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const targetUser = allUsers.find((u) => u.id === userId);
    setProfileUser(targetUser || null);
    setLoading(false);
  }, [userId, allUsers]);

  const handleSaveProfile = async (updatedUser: User) => {
    if (!updatedUser.dni) {
      toast({
        title: 'DNI Requerido',
        description: 'El DNI es necesario para buscar y vincular estadísticas.',
        variant: 'destructive',
      });
      return;
    }

    setProfileUser(updatedUser); // Update UI optimistically
    try {
      // Find player in all rosters in all tournaments
      const playersQuery = query(
        collectionGroup(db, 'players'),
        where('dni', '==', updatedUser.dni)
      );
      const querySnapshot = await getDocs(playersQuery);

      if (!querySnapshot.empty) {
        const playerDoc = querySnapshot.docs[0];
        const playerData = playerDoc.data() as PlayerDetails;

        const userWithDni = {
          ...updatedUser,
          name: `${playerData.name} ${playerData.lastName}`,
          // In a real scenario, you might want to recalculate stats here
        };
        const userRef = doc(db, 'users', userWithDni.id);
        await updateDoc(userRef, userWithDni);

        setProfileUser(userWithDni); // Update UI with full data
        setAllUsers((prev) =>
          prev.map((u) => (u.id === userWithDni.id ? userWithDni : u))
        );
         if (currentUser?.id === userWithDni.id) {
          setCurrentUser(userWithDni);
        }
        toast({
          title: '¡Perfil Vinculado!',
          description:
            'Tu perfil se ha vinculado con tus datos de jugador.',
        });
      } else {
        // Save user without linking if DNI not found, but DNI is saved
        const userRef = doc(db, 'users', updatedUser.id);
        await updateDoc(userRef, updatedUser);
        setAllUsers((prev) =>
            prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        );
         if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
        }
        toast({
          title: '¡Perfil Actualizado!',
          description: 'Tu DNI ha sido guardado, pero no se encontraron estadísticas para vincular.',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil.',
        variant: 'destructive',
      });
      // Revert optimistic update on error
      const originalUser = allUsers.find(u => u.id === updatedUser.id);
      setProfileUser(originalUser || null);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profileUser) {
      const file = e.target.files[0];
      try {
        const uploadedUrl = await uploadFile(file, `avatars/${profileUser.id}`);
        const updatedUser = { ...profileUser, avatar: uploadedUrl };

        const userRef = doc(db, 'users', profileUser.id);
        await updateDoc(userRef, { avatar: uploadedUrl });

        setProfileUser(updatedUser);
        setAllUsers((prev) =>
          prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        );
         if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
        }

        toast({
          title: '¡Avatar Actualizado!',
          description: 'Tu nueva foto de perfil ha sido guardada.',
        });
      } catch (error) {
        // The useUpload hook already shows a toast on error
      }
    }
  };

  const handleAvatarClick = () => {
    if (currentUser?.id === profileUser?.id && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleSendMessage = () => {
    if (!profileUser) return;
    router.push(`/messages?recipient=${profileUser.id}`);
  };

  if (loading || userLoading)
    return (
      <div className="p-8 text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
      </div>
    );
  if (!profileUser)
    return <div className="p-8 text-center">Usuario no encontrado.</div>;

  const isOwnProfile = currentUser?.id === profileUser.id;
  const {
    stats,
    name,
    role,
    league,
    division,
    sudpoints,
    isVerified,
    avatar,
    dni,
    profileBackground,
  } = profileUser;

  const finalStats =
    dni && stats ? stats : { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 };
  const winrate =
    finalStats.partidosJugados > 0
      ? Math.round((finalStats.victorias / finalStats.partidosJugados) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna Izquierda */}
        <div className="md:col-span-1 space-y-6">
          <Card className="relative">
            <CardHeader className="items-center text-center">
              <div className="absolute top-4 right-4">
                {currentUser && !isOwnProfile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFavorite(!isFavorite)}
                  >
                    <Star
                      className={cn(
                        'w-5 h-5 text-muted-foreground',
                        isFavorite && 'fill-accent text-accent'
                      )}
                    />
                  </Button>
                )}
              </div>
              <div
                className={cn(
                  'relative group',
                  isOwnProfile && 'cursor-pointer hover:opacity-80 transition-opacity'
                )}
                onClick={handleAvatarClick}
              >
                <AnimatedAvatar>
                  <Avatar className="w-32 h-32 text-4xl">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </AnimatedAvatar>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-white" />
                    <p className="text-white text-xs mt-2">
                      {Math.round(progress)}%
                    </p>
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="hidden"
                accept="image/*"
                disabled={isUploading}
              />

              <div className="flex items-center gap-2 pt-4">
                <CardTitle className="text-2xl">{name}</CardTitle>
                {isVerified && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Image
                          src="https://i.postimg.cc/8cm263zS/verificado.png"
                          alt="Verificado"
                          width={24}
                          height={24}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Usuario Verificado</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <CardDescription className="capitalize text-sm">
                {role === 'admin' || role === 'editor'
                  ? 'Administrador'
                  : 'Jugador'}
              </CardDescription>
              <div className="flex items-center gap-4 pt-2">
                <DivisionBadge league={league} division={division} />
              </div>
            </CardHeader>
            <CardContent>
              {currentUser &&
                !isOwnProfile &&
                currentUser.id !== 'visitor' && (
                  <Button className="w-full" onClick={handleSendMessage}>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Enviar Mensaje
                  </Button>
                )}
              {isOwnProfile && (
                <div className="mt-4">
                  <Label className="text-sm font-medium">
                    Progreso en la división
                  </Label>
                  <Progress
                    value={sudpoints}
                    className="h-2 my-1 bg-[#201538]"
                  />
                  <div className="flex justify-between">
                    <p className="text-xs text-muted-foreground mt-1">
                      Siguiente división
                    </p>
                    <p className="text-sm font-semibold">
                      {sudpoints} / 100 SP
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
             {isOwnProfile && (
                 <CardFooter>
                    <EditProfileDialog user={profileUser} onSave={handleSaveProfile}>
                        <Button variant="outline" className="w-full">
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar Perfil y Vincular DNI
                        </Button>
                    </EditProfileDialog>
                </CardFooter>
            )}
          </Card>
        </div>

        {/* Columna Derecha */}
        <div className="md:col-span-2 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Estadísticas del Jugador</CardTitle>
                    <CardDescription>Resumen del rendimiento en torneos.</CardDescription>
                </CardHeader>
                <CardContent>
                     {dni ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-6 text-center">
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-4xl font-bold">{finalStats.partidosJugados}</p>
                                <p className="text-sm text-muted-foreground">Partidos</p>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-4xl font-bold text-green-400">{finalStats.victorias}</p>
                                <p className="text-sm text-muted-foreground">Victorias</p>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-4xl font-bold text-yellow-400">{finalStats.empates}</p>
                                <p className="text-sm text-muted-foreground">Empates</p>
                            </div>
                             <div className="flex flex-col items-center gap-1">
                                <p className="text-4xl font-bold text-red-500">{finalStats.derrotas}</p>
                                <p className="text-sm text-muted-foreground">Derrotas</p>
                            </div>

                             <div className="flex flex-col items-center gap-1">
                                <p className="text-4xl font-bold">{finalStats.goles}</p>
                                <p className="text-sm text-muted-foreground">Goles</p>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <p className="text-4xl font-bold">{finalStats.mvps}</p>
                                <p className="text-sm text-muted-foreground">MVPs</p>
                            </div>
                             <div className="flex flex-col items-center gap-1">
                                <p className="text-4xl font-bold text-yellow-400">{finalStats.amarillas}</p>
                                <p className="text-sm text-muted-foreground">Amarillas</p>
                            </div>
                             <div className="flex flex-col items-center gap-1">
                                <p className="text-4xl font-bold text-red-500">{finalStats.rojas}</p>
                                <p className="text-sm text-muted-foreground">Rojas</p>
                            </div>
                        </div>
                     ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">Vincula tu DNI en "Editar Perfil" para ver tus estadísticas.</p>
                        </div>
                     )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

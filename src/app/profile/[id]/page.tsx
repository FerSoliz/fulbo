

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
import { DivisionBadge } from '@/components/division-badge';
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

const backgrounds = [
    'https://i.postimg.cc/1RfWNTCC/lusail.png', // Lusail -> AFA
    'https://i.postimg.cc/L4wxkTGH/monumental.png', // Monumental -> River
    'https://i.postimg.cc/76dmQW2x/interfaz-menu-png-1.png' // Interfaz -> Boca
];

const crestMap: { [key: string]: string } = {
    'https://i.postimg.cc/1RfWNTCC/lusail.png': 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png',
    'https://i.postimg.cc/L4wxkTGH/monumental.png': 'https://i.postimg.cc/3wts3GNd/escudito-river.png',
    'https://i.postimg.cc/76dmQW2x/interfaz-menu-png-1.png': 'https://i.postimg.cc/50jZytQp/escudito-de-boca.png'
};


const BackgroundChangerDialog = ({
  user,
  onSave,
  children,
}: {
  user: User;
  onSave: (updatedUser: User) => void;
  children: React.ReactNode;
}) => {

  const handleSelect = (url: string) => {
    onSave({ ...user, profileBackground: url });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Fondo de Perfil</DialogTitle>
          <DialogDescription>
            Elige una nueva imagen de cabecera para tu perfil.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {backgrounds.map((bg, index) => (
            <div
              key={index}
              className="relative aspect-video cursor-pointer group rounded-lg overflow-hidden"
              onClick={() => handleSelect(bg)}
            >
              <Image src={bg} alt={`Fondo ${index + 1}`} layout="fill" className="object-cover" />
               {user.profileBackground === bg && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
         <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cerrar
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
  const [activeTab, setActiveTab] = useState('stats');

  useEffect(() => {
    const targetUser = allUsers.find((u) => u.id === userId);
    setProfileUser(targetUser || null);
    setLoading(false);
  }, [userId, allUsers]);

  const handleSaveProfile = async (updatedUser: User) => {
    setProfileUser(updatedUser); // Update UI optimistically
    try {
        const userRef = doc(db, 'users', updatedUser.id);
        await updateDoc(userRef, { ...updatedUser });

        setAllUsers((prev) =>
          prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
        );
         if (currentUser?.id === updatedUser.id) {
          setCurrentUser(updatedUser);
        }
        toast({
          title: '¡Perfil Actualizado!',
          description:
            'Tus cambios han sido guardados.',
        });
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
    username,
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

  const currentCrest = profileBackground ? crestMap[profileBackground] : null;

  return (
     <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
      <Card>
        <div className="relative w-full aspect-[4/1]">
          {profileBackground && (
            <Image
              src={profileBackground}
              alt="Imagen de fondo del perfil"
              layout="fill"
              className="object-cover rounded-t-lg"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-t-lg" />
          
          <div className="absolute top-2 right-2 z-10 flex gap-2 items-center">
             {currentCrest && (
                <div className="w-10 h-10">
                   <Image src={currentCrest} alt="Escudo de equipo" width={40} height={40} />
                </div>
            )}
            {currentUser && !isOwnProfile && (
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setIsFavorite(!isFavorite)}
                className="rounded-full bg-black/30 text-white hover:bg-black/50"
              >
                <Star className={cn('w-5 h-5', isFavorite && 'fill-accent text-accent')} />
              </Button>
            )}
             {isOwnProfile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-10 h-10">
                    <Image src="https://i.postimg.cc/QMwW1G7J/witget-tuerquita.png" alt="Opciones" width={40} height={40} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <BackgroundChangerDialog user={profileUser} onSave={handleSaveProfile}>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Cambiar Fondo
                      </DropdownMenuItem>
                  </BackgroundChangerDialog>
                  <EditProfileDialog user={profileUser} onSave={handleSaveProfile}>
                     <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar Perfil
                    </DropdownMenuItem>
                  </EditProfileDialog>
                </DropdownMenuContent>
              </DropdownMenu>
             )}
          </div>
          
          <div className="absolute bottom-0 left-6 translate-y-1/2">
            <div
              className={cn('relative group', isOwnProfile && 'cursor-pointer hover:opacity-80 transition-opacity')}
              onClick={handleAvatarClick}
            >
              <AnimatedAvatar>
                <Avatar className="w-24 h-24 md:w-32 md:h-32 text-4xl border-4 border-background">
                  <AvatarImage src={avatar} alt={name} />
                  <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                </Avatar>
              </AnimatedAvatar>
              {isUploading && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                  <p className="text-white text-xs mt-2">{Math.round(progress)}%</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <CardHeader className="pt-16 md:pt-20 pb-4 px-6">
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
              <CardTitle className="text-2xl">{name}</CardTitle>
              {isVerified && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Image src="https://i.postimg.cc/8cm263zS/verificado.png" alt="Verificado" width={24} height={24} />
                    </TooltipTrigger>
                    <TooltipContent><p>Usuario Verificado</p></TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <CardDescription>@{username} · {role === 'admin' || role === 'editor' ? 'Administrador' : 'Jugador'}</CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 space-y-4">
          <div className="flex items-center gap-4">
            <DivisionBadge league={league} division={division} />
          </div>
          <div className="w-full">
            <Progress value={sudpoints} className="h-2 my-1 bg-[#201538]" />
            <div className="flex justify-between">
              <p className="text-xs text-muted-foreground mt-1">Siguiente división</p>
              <p className="text-sm font-semibold">{sudpoints} / 100 SP</p>
            </div>
          </div>
          {currentUser && !isOwnProfile && (
            <Button onClick={handleSendMessage} className="w-full">
              <MessageSquare className="mr-2 h-4 w-4" />
              Enviar Mensaje
            </Button>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas del Jugador</CardTitle>
          <CardDescription>Resumen del rendimiento en torneos.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-y-6">
          <div className="text-center">
            <p className="text-2xl font-bold">{finalStats.partidosJugados}</p>
            <p className="text-sm text-muted-foreground">Partidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{finalStats.victorias}</p>
            <p className="text-sm text-muted-foreground">Victorias</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{winrate}%</p>
            <p className="text-sm text-muted-foreground">Winrate</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{finalStats.goles}</p>
            <p className="text-sm text-muted-foreground">Goles</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{finalStats.asistencias}</p>
            <p className="text-sm text-muted-foreground">Asistencias</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{finalStats.mvps}</p>
            <p className="text-sm text-muted-foreground">MVPs</p>
          </div>
           <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">{finalStats.amarillas}</p>
            <p className="text-sm text-muted-foreground">Amarillas</p>
          </div>
           <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{finalStats.rojas}</p>
            <p className="text-sm text-muted-foreground">Rojas</p>
          </div>
        </CardContent>
        {!dni &&
            <CardFooter>
            </CardFooter>
        }
      </Card>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        className="hidden"
        accept="image/*"
        disabled={isUploading}
      />
    </div>
  );
}

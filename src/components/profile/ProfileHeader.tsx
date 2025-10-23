'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';
import { getDivisionInfo } from '@/lib/utils'; // ¡Nuestra función inteligente!
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedAvatar } from '@/components/ui/animated-avatar';
import { DivisionBadge } from '@/components/ui/division-badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Loader2, MessageSquare, Pencil, Image as ImageIcon, Handshake
} from 'lucide-react';
import { EditProfileDialog } from './EditProfileDialog';
import { BackgroundChangerDialog } from './BackgroundChangerDialog';
import { TransferStatusBadge } from './TransferStatusBadge';
import { TeamDisplay } from './TeamDisplay';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

const crestMap: { [key: string]: string } = {
  'https://i.postimg.cc/1RfWNTCC/lusail.png': 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png',
  'https://i.postimg.cc/BnnbJSjY/ELMONUMENTALRIVERPLATE2.png': 'https://i.postimg.cc/3wts3GNd/escudito-river.png',
  'https://i.postimg.cc/fL20hVKv/LABOMBONERABOCAJUNIORS.jpg': 'https://i.postimg.cc/50jZytQp/escudito-de-boca.png'
};

interface ProfileHeaderProps {
  profileUser: UserProfile;
  onSaveProfile: (updatedData: Partial<UserProfile>) => void;
  onSendMessage: () => void;
  onTransferClick: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const ProfileHeader = ({
  profileUser,
  onSaveProfile,
  onSendMessage,
  onTransferClick,
  onAvatarChange
}: ProfileHeaderProps) => {
  const { user: currentUser } = useUser();
  const { isUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.id === profileUser.id;
  const { name, username, role, isVerified, avatar, profileBackground, sudpoints = 0, team, transferStatus } = profileUser;

  // --- LÓGICA DE PROGRESO CENTRALIZADA ---
  const divisionInfo = getDivisionInfo(sudpoints);
  const isLeyenda = !isFinite(divisionInfo.endOfDivisionPoints);

  const currentCrest = profileBackground ? crestMap[profileBackground] : null;

  const handleAvatarClick = () => {
    if (isOwnProfile && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleChangeTransferStatus = (status: 'libre' | 'traspaso' | 'blindado') => onSaveProfile({ transferStatus: status });

  return (
    <Card className="overflow-hidden !rounded-t-7xl">
      <div className="relative w-full aspect-[4/1]">
        {profileBackground && <Image src={profileBackground} alt="Fondo de perfil" fill className="object-cover" priority />}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {/* --- MODIFICACIÓN: Iconos completamente pegados --- */}
        {(currentCrest || isOwnProfile) && (
          <div className="absolute bottom-0 right-0 z-10 flex items-center">
            {currentCrest && (
              <div className="w-8 h-8">
                <Image src={currentCrest} alt="Escudo del equipo" width={32} height={32} />
              </div>
            )}
            {isOwnProfile && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-8 h-8" aria-label="Opciones de perfil">
                    <Image src="https://i.postimg.cc/QMwW1G7J/witget-tuerquita.png" alt="Opciones" width={32} height={32} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <BackgroundChangerDialog user={profileUser} onSave={onSaveProfile}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}> <ImageIcon className="mr-2 h-4 w-4" />Cambiar Fondo </DropdownMenuItem>
                  </BackgroundChangerDialog>
                  <EditProfileDialog user={profileUser} onSave={onSaveProfile}>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}> <Pencil className="mr-2 h-4 w-4" />Editar Perfil </DropdownMenuItem>
                  </EditProfileDialog>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger> <Handshake className="mr-2 h-4 w-4" /><span>Estado de Fichaje</span> </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => handleChangeTransferStatus('libre')}>Libre</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeTransferStatus('traspaso')}>Traspaso</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleChangeTransferStatus('blindado')}>Blindado</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        <div className="absolute bottom-0 left-6 translate-y-1/2">
          <div className={cn('relative group', isOwnProfile && 'cursor-pointer')} onClick={handleAvatarClick} role="button" aria-label={isOwnProfile ? "Cambiar avatar" : "Avatar del usuario"}>
            <AnimatedAvatar>
              <Avatar className="w-24 h-24 text-4xl border-4 border-background">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
              </Avatar>
            </AnimatedAvatar>
            {isUploading && <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center" aria-live="polite" aria-label="Subiendo avatar"><Loader2 className="w-8 h-8 animate-spin" /></div>}
          </div>
        </div>
      </div>

      {/* --- MODIFICACIÓN: Estilo en línea para forzar el espaciado --- */}
      <CardHeader className="pt-14 pb-4 px-6 flex flex-col space-y-1">
        <CardTitle className="text-4xl italic" style={{ letterSpacing: '-0.05em' }}>
          <span className="text-accent-red">#</span>{username.toUpperCase()}
        </CardTitle>
        <CardDescription className="flex items-center gap-2 text-base">
            <span>{name}</span>
            {isVerified && (
                <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <span aria-label="Usuario verificado"><Image src="https://i.postimg.cc/8cm263zS/verificado.png" alt="Verificado" width={18} height={18} /></span>
                    </TooltipTrigger>
                    <TooltipContent><p>Verificado</p></TooltipContent>
                </Tooltip>
                </TooltipProvider>
            )}
            <span>· {role}</span>
        </CardDescription>
        <TeamDisplay team={team} />
      </CardHeader>

      <CardContent className="px-6 space-y-4">
        <div className="flex items-center gap-4">
          <DivisionBadge sudpoints={sudpoints} />
          {transferStatus && <TransferStatusBadge user={profileUser} onTransferClick={onTransferClick} />}
        </div>

        {!isLeyenda ? (
          <>
            <div className="flex items-center gap-4">
              <div className="relative flex-grow h-2 bg-muted rounded-full" role="progressbar" aria-valuenow={divisionInfo.progressPercentage} aria-valuemin={0} aria-valuemax={100}>
                <motion.div
                  className="absolute inset-y-0 left-0 bg-primary rounded-full flex items-center justify-center"
                  initial={{ width: '0%' }}
                  animate={{ width: `${divisionInfo.progressPercentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              <Trophy className="h-5 w-5 text-amber-500 -ml-2" aria-label="Meta de Sudpoints" />
            </div>
            <div className="flex justify-between mt-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground">Siguiente Nivel</p>
                  </TooltipTrigger>
                  <TooltipContent><p>{divisionInfo.pointsToNextDivision} SP para ascender a {divisionInfo.nextDivisionName}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <p className="text-sm font-semibold flex items-center gap-1">
                {divisionInfo.pointsInDivision} / {divisionInfo.totalPointsForDivision} SP
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-lg font-bold text-amber-500">¡LEYENDA MUNDIAL! 🏅</p>
            <p className="text-sm text-muted-foreground">Has alcanzado la cima. Total: {sudpoints} SP</p>
          </div>
        )}

        <input type="file" ref={fileInputRef} onChange={onAvatarChange} className="hidden" accept="image/*" disabled={isUploading} aria-label="Subir nueva imagen de perfil" />
        {!isOwnProfile && <Button onClick={onSendMessage} className="w-full"><MessageSquare className="mr-2 h-4 w-4" />Enviar Mensaje</Button>}
      </CardContent>
    </Card>
  );
};

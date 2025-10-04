
'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';
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
  const { name, username, role, league, division, isVerified, avatar, profileBackground, sudpoints = 0, team, transferStatus } = profileUser;

  const expToNextLevel = 100;
  const currentSudpoints = sudpoints;
  const progressInCurrentLevel = currentSudpoints % expToNextLevel;
  const passProgress = (progressInCurrentLevel / expToNextLevel) * 100;
  const pointsToNextLevel = expToNextLevel - progressInCurrentLevel;

  const currentCrest = profileBackground ? crestMap[profileBackground] : null;

  const handleAvatarClick = () => {
    if (isOwnProfile && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleChangeTransferStatus = (status: 'libre' | 'traspaso' | 'blindado') => onSaveProfile({ transferStatus: status });

  return (
    <Card>
      <div className="relative w-full aspect-[4/1]">
        {profileBackground && <Image src={profileBackground} alt="Fondo de perfil" layout='fill' className="object-cover rounded-t-lg" priority />}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        <div className="absolute top-2 right-2 z-10 flex gap-2 items-center">
          {currentCrest && <div className="w-10 h-10"><Image src={currentCrest} alt="Escudo del equipo" width={40} height={40} /></div>}
          {isOwnProfile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-10 h-10" aria-label="Opciones de perfil">
                  <Image src="https://i.postimg.cc/QMwW1G7J/witget-tuerquita.png" alt="Opciones" width={40} height={40} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <BackgroundChangerDialog user={profileUser} onSave={onSaveProfile}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <ImageIcon className="mr-2 h-4 w-4" />Cambiar Fondo
                  </DropdownMenuItem>
                </BackgroundChangerDialog>
                <EditProfileDialog user={profileUser} onSave={onSaveProfile}>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Pencil className="mr-2 h-4 w-4" />Editar Perfil
                  </DropdownMenuItem>
                </EditProfileDialog>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Handshake className="mr-2 h-4 w-4" /><span>Estado de Fichaje</span>
                  </DropdownMenuSubTrigger>
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
      <CardHeader className="pt-16 pb-4 px-6">
        <div className="flex items-center gap-2">
          <CardTitle className="text-2xl">{name}</CardTitle>
          {isVerified && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span aria-label="Usuario verificado">
                    <Image src="https://i.postimg.cc/8cm263zS/verificado.png" alt="Verificado" width={24} height={24} />
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>Verificado</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <CardDescription>@{username} · {role}</CardDescription>
        <TeamDisplay team={team} />
      </CardHeader>
      <CardContent className="px-6 space-y-4">
        <div className="flex items-center gap-4">
          <DivisionBadge league={league} division={division} />
          {transferStatus && <TransferStatusBadge user={profileUser} onTransferClick={onTransferClick} />}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative flex-grow h-2 bg-muted rounded-full" role="progressbar" aria-valuenow={passProgress} aria-valuemin={0} aria-valuemax={100}>
            <motion.div
              className="absolute inset-y-0 left-0 bg-primary rounded-full flex items-center justify-center"
              initial={{ width: '0%' }}
              animate={{ width: `${passProgress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {passProgress > 15 && (
                <span className="absolute left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary-foreground select-none" aria-hidden="true">
                  {Math.round(passProgress)}%
                </span>
              )}
              {passProgress > 0 && (
                <div className="absolute right-0 h-3 w-3 -translate-y-1/2 translate-x-1/2 top-1/2 bg-primary rounded-full shadow-sm border border-background" aria-hidden="true" />
              )}
            </motion.div>
          </div>
          <Trophy className="h-5 w-5 text-amber-500 -ml-2" aria-label="Meta de Sudpoints" />
        </div>
        <div className="flex justify-between mt-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="text-xs text-muted-foreground">Siguiente nivel</p>
              </TooltipTrigger>
              <TooltipContent><p>{pointsToNextLevel} Sudpoints para el siguiente nivel</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-sm font-semibold flex items-center gap-1">
            {currentSudpoints} / {expToNextLevel} Sudpoints
          </p>
        </div>
        <input type="file" ref={fileInputRef} onChange={onAvatarChange} className="hidden" accept="image/*" disabled={isUploading} aria-label="Subir nueva imagen de perfil" />
        {!isOwnProfile && <Button onClick={onSendMessage} className="w-full"><MessageSquare className="mr-2 h-4 w-4" />Enviar Mensaje</Button>}
      </CardContent>
    </Card>
  );
};

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';
import { getDivisionInfo } from '@/lib/utils';
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
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Loader2, MessageSquare, Pencil, Image as ImageIcon, Handshake, Star
} from 'lucide-react';
import { EditProfileDialog } from './EditProfileDialog';
import { BackgroundChangerDialog } from './BackgroundChangerDialog';
import { TransferStatusBadge } from './TransferStatusBadge';
import { useRef } from 'react';
import { motion } from 'framer-motion';
import { ProfileNav } from './ProfileNav';

const crestMap: { [key: string]: string } = {
  'https://i.postimg.cc/1RfWNTCC/lusail.png': 'https://i.postimg.cc/YqTT9ktz/escudito-afa.png',
  'https://i.postimg.cc/BnnbJSjY/ELMONUMENTALRIVERPLATE2.png': 'https://i.postimg.cc/3wts3GNd/escudito-river.png',
  'https://i.postimg.cc/fL20hVKv/LABOMBONERABOCAJUNIORS.jpg': 'https://i.postimg.cc/50jZytQp/escudito-de-boca.png',
};

const GuestRegisterBanner = ({ guestName, guestDni }: { guestName: string; guestDni: string }) => (
  <Link href={`/register?dni=${guestDni}`} passHref>
    <div className="relative text-center p-4 rounded-lg bg-gradient-to-r from-accent-red to-red-700 hover:from-red-700 hover:to-accent-red transition-all duration-300 cursor-pointer shadow-lg">
      <div className="absolute -top-3 -left-3 w-8 h-8 bg-white rounded-full flex items-center justify-center">
        <Star className="text-accent-red w-5 h-5" />
      </div>
      <p className="font-bold text-white text-lg">¿Eres {guestName}?</p>
      <p className="text-sm text-white/90">¡Regístrate para reclamar tu perfil y guardar tus estadísticas!</p>
    </div>
  </Link>
);

interface ProfileHeaderProps {
  profileUser: UserProfile;
  onSaveProfile: (updatedData: Partial<UserProfile>) => void;
  onSendMessage: () => void;
  onTransferClick: () => void;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  activeTab: 'perfil' | 'equipo';
  onTabChange: (tab: 'perfil' | 'equipo') => void;
  hasTeam: boolean;
}

export function ProfileHeader({ 
  profileUser, 
  onSaveProfile, 
  onSendMessage, 
  onTransferClick, 
  onAvatarChange, 
  activeTab, 
  onTabChange, 
  hasTeam 
}: ProfileHeaderProps) {
  const { user: currentUser } = useUser();
  const { isUploading } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = currentUser?.id === profileUser.id;
  const { name, username = '', role, isVerified, avatar, profileBackground, sudpoints = 0, transferStatus, isGuest, dni } = profileUser;

  const divisionInfo = getDivisionInfo(sudpoints);
  const isLeyenda = !isFinite(divisionInfo.endOfDivisionPoints);

  const currentCrest = profileBackground ? crestMap[profileBackground] : null;

  function handleAvatarClick() {
    if (isOwnProfile && !isUploading && !isGuest) {
      fileInputRef.current?.click();
    }
  }

  function handleChangeTransferStatus(status: 'libre' | 'traspaso' | 'blindado') {
    onSaveProfile({ transferStatus: status });
  }

  return (
    <Card className="overflow-hidden rounded-t-7xl rounded-b-none bg-[url('/assets/profile/puntos.png')]">
      <div className="relative w-full aspect-[4/1]">
        {profileBackground && <Image src={profileBackground} alt="Fondo de perfil" fill className="object-cover" priority />}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

        {(currentCrest || (isOwnProfile && !isGuest)) && (
          <div className="absolute bottom-0 right-0 z-10 flex items-center">
            {currentCrest && (
              <div className="w-8 h-8">
                <Image src={currentCrest} alt="Escudo del equipo" width={32} height={32} />
              </div>
            )}
            {isOwnProfile && !isGuest && (
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
          <div className={cn('relative group', isOwnProfile && !isGuest && 'cursor-pointer')} onClick={handleAvatarClick} role="button" aria-label={isOwnProfile && !isGuest ? "Cambiar avatar" : "Avatar del usuario"}>
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

      <CardHeader className="pt-14 pb-4 px-6 flex flex-col gap-2">
        <div>
          <CardTitle className="transform origin-left scale-x-50 md:scale-x-100 text-4xl font-bold italic mb-0 leading-[0.8] tracking-tighter">
            <span className="text-accent-red">#</span>{username.toUpperCase()}
          </CardTitle>
          <CardDescription className="flex items-center gap-2 text-base">
              <span className="font-semibold text-white">#{name.toUpperCase()}</span>
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
        </div>
      </CardHeader>

      <CardContent className="px-6 space-y-4">
        <div className="space-y-2"> 
          <div className="flex items-center gap-4">
            <DivisionBadge sudpoints={sudpoints} />
            {transferStatus && <TransferStatusBadge user={profileUser} onTransferClick={onTransferClick} />}
          </div>

          {!isLeyenda ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col flex-grow">
                <div className="relative h-2 flex-grow bg-muted rounded-full">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: `${divisionInfo.progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                <div className="flex justify-between mt-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="text-[11px] text-white uppercase leading-none">Siguiente Nivel</p>
                      </TooltipTrigger>
                      <TooltipContent><p>{divisionInfo.pointsToNextDivision} SP para ascender a {divisionInfo.nextDivisionName}</p></TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-[11px] text-white font-semibold leading-none">
                    {divisionInfo.pointsInDivision} / {divisionInfo.totalPointsForDivision}
                  </p>
                </div>
              </div>
              <Image src="/assets/profile/logosd.png" alt="Siguiente División" width={40} height={40} className="-translate-y-2" />
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-lg font-bold text-amber-500">¡LEYENDA MUNDIAL! 🏅</p>
              <p className="text-sm text-muted-foreground">Has alcanzado la cima. Total: {sudpoints} SP</p>
            </div>
          )}
        </div>

        {isGuest ? (
          <GuestRegisterBanner guestName={name} guestDni={dni!} />
        ) : (
          <>
            <input type="file" ref={fileInputRef} onChange={onAvatarChange} className="hidden" accept="image/*" disabled={isUploading} aria-label="Subir nueva imagen de perfil" />
            {!isOwnProfile && <Button onClick={onSendMessage} className="w-full"><MessageSquare className="mr-2 h-4 w-4" />Enviar Mensaje</Button>}
          </>
        )}
      </CardContent>
      
      <ProfileNav
        activeTab={activeTab}
        onTabChange={onTabChange}
        hasTeam={hasTeam}
      />
    </Card>
  );
}

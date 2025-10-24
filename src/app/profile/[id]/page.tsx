'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUpcomingMatches, EnrichedMatch } from '@/hooks/use-upcoming-matches'; // Importamos el nuevo hook y el tipo
import { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { updateUserProfile, updateUserAvatar } from '@/lib/firebase/db/users';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTeamBadge } from '@/components/profile/ProfileTeamBadge';
import { ClockBadge } from '@/components/profile/ClockBadge';
import { ProfileActions, ProfileView } from '@/components/profile/ProfileActions';
import { SudonePassView } from '@/components/profile/SudonePassView';
import { RankingPreview } from '@/components/profile/RankingPreview';
import { TournamentsView } from '@/components/profile/TournamentsView';
import { MyTeamModal } from '@/components/profile/MyTeamModal';
import { PlayerStatsView } from '@/components/profile/PlayerStatsView';
import { MatchHistoryView } from '@/components/profile/MatchHistoryView';
import { NextMatchView } from '@/components/profile/NextMatchView';

const viewComponents: Record<ProfileView, React.ComponentType<any>> = {
  buttons: () => null,
  sudone_pass: SudonePassView,
  ranking_preview: RankingPreview,
  my_team: MyTeamModal,
  stats: PlayerStatsView,
  history: MatchHistoryView,
  next_match: NextMatchView,
  favorite_tournaments: TournamentsView,
};

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { toast } = useToast();
  const { user: currentUser, refreshUser } = useUser();
  const { uploadFile } = useUpload();
  const [view, setView] = useState<ProfileView>('buttons');

  const { profileUser, loading: profileLoading } = useUserProfile(userId);
  // Usamos el nuevo hook para obtener los próximos partidos
  const { upcomingMatches, loading: matchesLoading } = useUpcomingMatches(profileUser?.team?.id);

  const nextMatch = upcomingMatches?.[0]; // El próximo partido es el primero de la lista

  const handleProfileUpdate = async (data: Partial<UserProfile>) => {
    if (!profileUser) return;
    try {
      await updateUserProfile(profileUser.id, data);
      toast({ title: 'Éxito', description: 'Perfil actualizado correctamente.' });
      if (currentUser && currentUser.id === profileUser.id) {
        await refreshUser();
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({ title: "Error", description: "No se pudo actualizar el perfil.", variant: "destructive" });
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!profileUser || !event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    const path = `users/${profileUser.id}/avatars/${file.name}`;
    const url = await uploadFile(file, path);
    if (url) {
      try {
        await updateUserAvatar(profileUser.id, url);
        toast({ title: 'Éxito', description: 'Avatar actualizado correctamente.' });
        if (currentUser && currentUser.id === profileUser.id) {
            await refreshUser();
        }
      } catch (error) {
        console.error("Error updating avatar:", error);
        toast({ title: "Error", description: "No se pudo actualizar el avatar.", variant: "destructive" });
      }
    }
  };

  const ActiveView = viewComponents[view] || null;

  if (profileLoading) {
    return <div className="flex items-center justify-center h-screen" role="status" aria-live="polite"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="sr-only">Cargando perfil...</span></div>;
  }

  if (!profileUser) {
    return <div className="p-8 text-center" aria-live="polite">Usuario no encontrado.</div>;
  }
  
  const viewProps = {
      profileUser: profileUser,
      profileUserId: userId,
      onClose: () => setView('buttons'),
      // Pasamos los datos relevantes a la vista activa
      upcomingMatches: upcomingMatches, 
      loadingMatches: matchesLoading,
  };

  return (
    <div className="container mx-auto px-4 pt-2 pb-4 sm:px-6 sm:pb-6 sm:pt-4 lg:px-8 lg:pb-8 lg:pt-6 space-y-2 rounded-t-20x2 overflow-hidden">
      <div className="flex justify-between items-center w-full">
        <div>
          {profileUser?.team && <ProfileTeamBadge team={profileUser.team} />}
        </div>
        <div>
          {/* Pasamos el próximo partido al ClockBadge */}
          <ClockBadge nextMatch={nextMatch} />
        </div>
      </div>

      <ProfileHeader 
        profileUser={profileUser}
        onSaveProfile={handleProfileUpdate}
        onAvatarChange={handleAvatarUpload}
        onSendMessage={() => toast({ title: 'Próximamente', description: 'La mensajería aún no está implementada.' })}
        onTransferClick={() => toast({ title: 'Próximamente', description: 'El mercado de fichajes se abrirá pronto.' })}
      />

        {view === 'buttons' ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <ProfileActions setView={setView} />
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {ActiveView && <ActiveView {...viewProps} />}
          </AnimatePresence>
        )}
    </div>
  );
}

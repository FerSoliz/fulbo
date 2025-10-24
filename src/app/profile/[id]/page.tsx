'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';
import { useUserProfile } from '@/hooks/useUserProfile';
import { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { updateUserProfile, updateUserAvatar } from '@/lib/firebase/db/users';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTeamBadge } from '@/components/profile/ProfileTeamBadge';
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

  const { profileUser, loading } = useUserProfile(userId);

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

  if (loading) {
    return <div className="flex items-center justify-center h-screen" role="status" aria-live="polite"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="sr-only">Cargando perfil...</span></div>;
  }

  if (!profileUser) {
    return <div className="p-8 text-center" aria-live="polite">Usuario no encontrado.</div>;
  }
  
  const viewProps = {
      profileUser: profileUser,
      profileUserId: userId,
      onClose: () => setView('buttons'),
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 rounded-t-20x2 overflow-hidden">
      {profileUser?.team && (
        <div className="w-full flex justify-start">
          <ProfileTeamBadge team={profileUser.team} />
        </div>
      )}
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

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useUpcomingMatches } from '@/hooks/use-upcoming-matches';
import { UserProfile, ProfileView } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { updateUserProfile, updateUserAvatar } from '@/lib/firebase/db/users';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileTeamBadge } from '@/components/profile/ProfileTeamBadge';
import { ClockBadge } from '@/components/profile/ClockBadge';
import { ActionCard } from '@/components/profile/ActionCard';

// Vistas de los modales
import { SudonePassView } from '@/components/profile/SudonePassView';
import { RankingPreview } from '@/components/profile/RankingPreview';
import { TournamentsView } from '@/components/profile/TournamentsView';
import { MyTeamModal } from '@/components/profile/MyTeamModal';
import { PlayerStatsView } from '@/components/profile/PlayerStatsView';
import { MatchHistoryView } from '@/components/profile/MatchHistoryView';
import { NextMatchView } from '@/components/profile/NextMatchView';

// Placeholder para funcionalidades futuras
const ComingSoonView = ({ onClose, toast }) => {
  useEffect(() => {
    toast({ title: 'Próximamente', description: 'Esta función estará disponible pronto.' });
    onClose();
  }, [onClose, toast]);

  return null; // No renderiza nada
};

const viewComponents: Record<ProfileView, React.ComponentType<any>> = {
  buttons: () => null,
  sudone_pass: SudonePassView,
  ranking_preview: RankingPreview,
  my_team: MyTeamModal,
  stats: PlayerStatsView,
  history: MatchHistoryView,
  next_match: NextMatchView,
  favorite_tournaments: TournamentsView,
  my_data: (props) => <ComingSoonView {...props} toast={useToast().toast} />, // Añadido
  coach: (props) => <ComingSoonView {...props} toast={useToast().toast} />, // Añadido
};

const actionCards = [
  {
    view: 'stats' as ProfileView,
    title: 'Estadísticas',
    tab: 'perfil',
    bgImage: '/assets/profile/persona.png',
  },
  {
    view: 'ranking_preview' as ProfileView,
    title: 'Ranking',
    tab: 'perfil',
    bgImage: '/assets/profile/estandarte.png',
  },
    {
    view: 'my_data' as ProfileView, // Vista temporal
    title: 'Mis Datos',
    tab: 'perfil',
    bgImage: '/assets/profile/puntos.png', // Placeholder
  },
  {
    view: 'favorite_tournaments' as ProfileView,
    title: 'Torneos',
    tab: 'perfil',
    bgImage: '/assets/profile/fondo-pelota.png',
  },
  {
    view: 'history' as ProfileView,
    title: 'Historial',
    tab: 'equipo',
    bgImage: '/assets/profile/estandarte.png',
  },
  {
    view: 'next_match' as ProfileView,
    title: 'Fixture',
    tab: 'equipo',
    bgImage: '/assets/profile/fondo-pelota.png',
  },
  {
    view: 'my_team' as ProfileView,
    title: 'Equipo',
    tab: 'equipo',
    bgImage: '/assets/profile/team.png',
  },
  {
    view: 'coach' as ProfileView, // Vista temporal
    title: 'DT',
    tab: 'equipo',
  },
];

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const { toast } = useToast();
  const { user: currentUser, refreshUser } = useUser();
  const { uploadFile } = useUpload();
  const [view, setView] = useState<ProfileView>('buttons');
  const [activeTab, setActiveTab] = useState<'perfil' | 'equipo'>('perfil');

  const { profileUser, loading: profileLoading } = useUserProfile(userId);
  const { upcomingMatches, loading: matchesLoading } = useUpcomingMatches(profileUser?.team?.id);

  const nextMatch = upcomingMatches?.[0];

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
  
  const handleCloseModal = useCallback(() => {
    setView('buttons');
  }, []);

  const ActiveView = viewComponents[view] || null;

  if (profileLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (!profileUser) {
    return <div className="p-8 text-center">Usuario no encontrado.</div>;
  }
  
  const viewProps = {
      profileUser: profileUser,
      profileUserId: userId,
      teamId: profileUser.team?.id,
      onClose: handleCloseModal,
      upcomingMatches: upcomingMatches, 
      loadingMatches: matchesLoading,
      toast
  };
  
  const cardsForTab = actionCards.filter(card => card.tab === activeTab);

  return (
    <div className="container mx-auto px-4 pt-2 pb-4 sm:px-6 sm:pb-6 sm:pt-4 lg:px-8 lg:pb-8 lg:pt-6 space-y-2 rounded-t-20x2 overflow-hidden">
      <div className="flex justify-between items-center w-full">
        <div>
          {profileUser?.team && <ProfileTeamBadge team={profileUser.team} />}
        </div>
        <div>
          <ClockBadge nextMatch={nextMatch} />
        </div>
      </div>

      <ProfileHeader 
        profileUser={profileUser}
        onSaveProfile={handleProfileUpdate}
        onAvatarChange={handleAvatarUpload}
        onSendMessage={() => toast({ title: 'Próximamente', description: 'La mensajería aún no está implementada.' })}
        onTransferClick={() => toast({ title: 'Próximamente', description: 'El mercado de fichajes se abrirá pronto.' })}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        hasTeam={!!profileUser?.team}
      />

      {view === 'buttons' ? (
        <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 gap-[6px] pt-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
         >
          {cardsForTab.map((card) => (
            <div key={card.view} className="aspect-[2.17/1]">
              <ActionCard
                title={card.title}
                onClick={() => setView(card.view)}
                secondaryBgImage={card.bgImage}
              />
            </div>
          ))}
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {ActiveView && <ActiveView {...viewProps} />}
        </AnimatePresence>
      )}
    </div>
  );
}

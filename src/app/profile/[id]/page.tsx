
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';
import { ref, update, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileActions, ProfileView } from '@/components/profile/ProfileActions';
import { SudonePassView } from '@/components/profile/SudonePassView';
import { RankingPreview } from '@/components/profile/RankingPreview';
import { FavoriteTournamentsView } from '@/components/profile/FavoriteTournamentsView';
import { InfoView } from '@/components/profile/InfoView';
import { MyTeamModal } from '@/components/profile/MyTeamModal';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const { toast } = useToast();
  const { user: currentUser } = useUser();
  const { uploadFile } = useUpload();

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ProfileView>('buttons');

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    const userRef = ref(db, `users/${userId}`);
    const unsubscribe = onValue(userRef, (snapshot) => {
      if (snapshot.exists()) {
        setProfileUser({ id: snapshot.key, ...snapshot.val() } as UserProfile);
      } else {
        setProfileUser(null);
        toast({ title: "Error", description: "Usuario no encontrado.", variant: "destructive" });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error en Realtime Database:", error);
      toast({ title: "Error de Red", variant: "destructive" });
      setLoading(false);
    });
    return () => off(userRef, 'value', unsubscribe);
  }, [userId, toast]);

  const handleSaveProfile = async (updatedData: Partial<UserProfile>) => {
    if (!profileUser) return;
    const userRef = ref(db, `users/${profileUser.id}`);
    try {
      await update(userRef, updatedData);
      toast({ title: '¡Perfil Actualizado!' });
    } catch (error) {
      toast({ title: 'Error al actualizar', variant: 'destructive' });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && profileUser) {
      const file = e.target.files[0];
      const uploadedUrl = await uploadFile(file, `avatars/${profileUser.id}`);
      if (uploadedUrl) await handleSaveProfile({ avatar: uploadedUrl });
    }
  };

  const handleSendMessage = () => router.push(`/messages?recipient=${profileUser?.id}`);
  const handleTransferClick = () => router.push(`/messages?recipient=${profileUser?.id}`);

  const handleClaimReward = (level: number) => {
    if (!profileUser || !profileUser.claimedPassRewards) return;
    const currentClaims = profileUser.claimedPassRewards || [];
    const newClaims = [...currentClaims, level];
    handleSaveProfile({ claimedPassRewards: newClaims });
    toast({ title: `¡Nivel ${level} Reclamado!` });
  };

  if (loading) {
    return <div className="p-8 text-center" role="status" aria-live="polite"><Loader2 className="mx-auto h-8 w-8 animate-spin" /><span className="sr-only">Cargando perfil...</span></div>;
  }

  if (!profileUser) {
    return <div className="p-8 text-center" aria-live="polite">Usuario no encontrado.</div>;
  }

  const expToNextLevel = 100;
  const currentSudpoints = profileUser.sudpoints || 0;
  const currentLevel = Math.floor(currentSudpoints / expToNextLevel) + 1;
  const progressInCurrentLevel = currentSudpoints % expToNextLevel;
  const passProgress = (progressInCurrentLevel / expToNextLevel) * 100;

  return (
    <>
      <AnimatePresence>
        {view === 'buttons' && (
          <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
            <motion.div initial={false} animate={{ y: 0 }} exit={{ y: '-100%', opacity: 0 }}>
              <ProfileHeader
                profileUser={profileUser}
                onSaveProfile={handleSaveProfile}
                onSendMessage={handleSendMessage}
                onTransferClick={handleTransferClick}
                onAvatarChange={handleAvatarChange}
              />
            </motion.div>
            <motion.div initial={false} animate={{ y: 0 }} exit={{ y: '-100%', opacity: 0 }}>
              <ProfileActions setView={setView} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {view === 'history' && <InfoView title="Historial" onClose={() => setView('buttons')}><p>Próximamente...</p></InfoView>}
        {view === 'stats' && <InfoView title="Estadísticas" onClose={() => setView('buttons')}><p>Próximamente...</p></InfoView>}
        {view === 'next_match' && <InfoView title="Próximo Partido" onClose={() => setView('buttons')}><p>Próximamente...</p></InfoView>}
        
        {view === 'my_team' && (
          profileUser.team ? (
            <MyTeamModal team={profileUser.team} onClose={() => setView('buttons')} />
          ) : (
            <InfoView title="Mi Equipo" onClose={() => setView('buttons')}>
              <p>Este jugador no forma parte de ningún equipo actualmente.</p>
            </InfoView>
          )
        )}

        {view === 'sudone_pass' && (
          <SudonePassView 
            currentLevel={currentLevel}
            currentSudpoints={currentSudpoints}
            passProgress={passProgress}
            claimedPassRewards={profileUser.claimedPassRewards || []}
            handleClaimReward={handleClaimReward}
            onClose={() => setView('buttons')} 
          />
        )}

        {view === 'ranking_preview' && <RankingPreview profileUserId={profileUser.id} onClose={() => setView('buttons')} />}

        {view === 'favorite_tournaments' && <FavoriteTournamentsView onClose={() => setView('buttons')} />}
      </AnimatePresence>
    </>
  );
}

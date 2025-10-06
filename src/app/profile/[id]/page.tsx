
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';
import { ref, update, onValue, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// --- Componentes de la Vista de Perfil ---
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileActions, ProfileView } from '@/components/profile/ProfileActions';
import { SudonePassView } from '@/components/profile/SudonePassView';
import { RankingPreview } from '@/components/profile/RankingPreview';
import { TournamentsView } from '@/components/profile/TournamentsView';
import { MyTeamModal } from '@/components/profile/MyTeamModal';
import { PlayerStatsView } from '@/components/profile/PlayerStatsView';

export default function ProfilePage() {
  const params = useParams();
  const userId = params.id as string; // Este userId viene de la URL y debería ser siempre válido aquí
  const { toast } = useToast();
  const { user: currentUser, refreshUser } = useUser();
  const { uploadFile } = useUpload();

  const [profileUser, setProfileUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ProfileView>('buttons');

  const fetchProfileUser = useCallback(() => {
    if (!userId) return () => {};
    setLoading(true);
    const userRef = ref(db, `users/${userId}`);
    const onData = (snapshot: any) => {
      if (snapshot.exists()) {
        setProfileUser({ id: snapshot.key, ...snapshot.val() });
      } else {
        setProfileUser(null);
        toast({ title: "Error", description: "Usuario no encontrado.", variant: "destructive" });
      }
      setLoading(false);
    };
    const onError = (error: any) => {
      console.error("Firebase DB Error:", error);
      toast({ title: "Error de Red", variant: "destructive" });
      setLoading(false);
    };

    onValue(userRef, onData, onError);

    return () => off(userRef, 'value', onData);
  }, [userId, toast]);

  useEffect(() => {
    const unsubscribe = fetchProfileUser();
    return () => unsubscribe();
  }, [fetchProfileUser]);

  const handleProfileUpdate = async (data: Partial<UserProfile>) => {
    if (!profileUser) return;
    const userRef = ref(db, `users/${profileUser.id}`);
    try {
      await update(userRef, data);
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
      await handleProfileUpdate({ avatar: url });
    }
  };


  if (loading) {
    return <div className="flex items-center justify-center h-screen" role="status" aria-live="polite"><Loader2 className="h-12 w-12 animate-spin text-primary" /><span className="sr-only">Cargando perfil...</span></div>;
  }

  if (!profileUser) {
    return <div className="p-8 text-center" aria-live="polite">Usuario no encontrado.</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <ProfileHeader 
        profileUser={profileUser}
        onSaveProfile={handleProfileUpdate}
        onAvatarChange={handleAvatarUpload}
        onSendMessage={() => toast({ title: 'Próximamente', description: 'La mensajería aún no está implementada.' })}
        onTransferClick={() => toast({ title: 'Próximamente', description: 'El mercado de fichajes se abrirá pronto.' })}
      />

      {/* Si la vista es 'buttons', muestra la botonera */}
      {view === 'buttons' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
          <ProfileActions setView={setView} />
        </motion.div>
      )}

      {/* AnimatePresence maneja las transiciones de entrada y salida de los componentes */}
      <AnimatePresence mode="wait">
        {view === 'favorite_tournaments' && <TournamentsView profileUser={profileUser} onClose={() => setView('buttons')} />}
        {view === 'sudone_pass' && <SudonePassView onClose={() => setView('buttons')} />}
        {/* ¡IMPORTANTE! Pasamos userId directamente aquí */}
        {view === 'ranking_preview' && <RankingPreview profileUserId={userId} onClose={() => setView('buttons')} />}
        {view === 'my_team' && <MyTeamModal profileUser={profileUser} onClose={() => setView('buttons')} />}
        
        {view === 'stats' && <PlayerStatsView profileUser={profileUser} onClose={() => setView('buttons')} />}

      </AnimatePresence>

    </div>
  );
}

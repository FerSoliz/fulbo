'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification, PlayerStats } from '@/lib/types'; // Asegúrate que PlayerStats está en types
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase'; 
import { ref, onValue, get, set, update, increment, Unsubscribe, remove, child } from 'firebase/database';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { RegisterInput } from '@/lib/validators';

// El defaultVisitor no necesita cambios
const defaultVisitor: User = {
    id: 'visitor',
    name: 'VISITANTE',
    username: 'visitante',
    email: '', // Añadido para consistencia
    role: 'player',
    avatar: 'https://avatar.vercel.sh/visitor.png',
    isVerified: false,
    isBlocked: false,
    location: '',
    sudpoints: 0,
    // baseSudpoints, league, division y stats ya no son obligatorios en el tipo User
};

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  // ¡Modificado! Ahora recibe el objeto completo de datos del formulario
  register: (data: RegisterInput, profileBackground: string) => Promise<boolean>;
  logout: () => Promise<void>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  availablePacks: number;
  setAvailablePacks: React.Dispatch<React.SetStateAction<number>>;
  nextPackTimestamp: number | null;
  setNextPackTimestamp: React.Dispatch<React.SetStateAction<number | null>>;
  countdown: string;
  trackInteraction: () => void;
  trackPackOpening: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [availablePacks, setAvailablePacks] = useState(0);
  const [nextPackTimestamp, setNextPackTimestamp] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  // El useEffect de onAuthStateChanged no necesita cambios significativos,
  // se enfoca en mantener la sesión del usuario sincronizada.
  useEffect(() => {
    let unsubscribeUser: Unsubscribe = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeUser();
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        unsubscribeUser = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUser({ id: firebaseUser.uid, ...snapshot.val() });
          } else {
             // Si el usuario existe en Auth pero no en DB, podría ser un error.
             // Por ahora, lo tratamos como un usuario nuevo sin datos.
             setUser(null); 
          }
          setLoading(false);
        });
      } else {
        setUser(defaultVisitor);
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
     // La función de login no cambia
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        router.push('/');
        return true;
    } catch(error: any) {
        toast({ title: "Error de inicio de sesión", description: "El correo electrónico o la contraseña son incorrectos.", variant: "destructive" });
        setLoading(false);
        return false;
    }
  };

  // --- ¡FUNCIÓN DE REGISTRO COMPLETAMENTE REFACTORIZADA! ---
  const register = async (data: RegisterInput, profileBackground: string): Promise<boolean> => {
    const { name, username, email, password, dni } = data;
    setLoading(true);

    try {
      // Paso 1: Buscar si el DNI pertenece a un jugador invitado para migrar sus datos.
      const guestPlayerRef = ref(db, `guestPlayers/${dni}`);
      const guestPlayerSnap = await get(guestPlayerRef);
      
      const playerStatsRef = ref(db, `playerStats/${dni}`);
      const playerStatsSnap = await get(playerStatsRef);

      const isGuestMigration = guestPlayerSnap.exists();
      const guestData = guestPlayerSnap.val();
      const existingStats: PlayerStats | null = playerStatsSnap.val();

      // Paso 2: Crear el usuario en Firebase Authentication (esto no cambia).
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // Paso 3: Preparar los datos del nuevo perfil, fusionando si es necesario.
      const newUserProfile: Omit<User, 'id'> = {
        name: isGuestMigration ? guestData.name : name, // Usar nombre de invitado si existe
        username,
        email,
        dni,
        profileBackground,
        avatar: `https://avatar.vercel.sh/${username}.png`,
        role: 'player',
        isVerified: false,
        isBlocked: false,
        location: '',
        // ¡CRÍTICO! Usar los sudpoints existentes o iniciar en 0.
        sudpoints: existingStats?.totals?.sudpoints || 0, 
      };

      // Paso 4: Realizar la operación en la base de datos de forma ATÓMICA.
      const updates: { [key: string]: any } = {};

      // 4.1. Añadir el nuevo perfil de usuario en la rama /users.
      updates[`/users/${uid}`] = newUserProfile;

      // 4.2. Si hay estadísticas existentes, moverlas a la nueva UID.
      if (existingStats) {
        updates[`/playerStats/${uid}`] = existingStats;
      }

      // 4.3. Si fue una migración, limpiar los datos obsoletos del invitado.
      if (isGuestMigration) {
        updates[`/guestPlayers/${dni}`] = null; // Elimina el perfil de invitado.
        updates[`/playerStats/${dni}`] = null; // Elimina las estadísticas antiguas por DNI.
      }
      
      // Ejecutar todas las operaciones como un solo batch.
      await update(ref(db), updates);

      toast({ title: "¡Cuenta Creada!", description: "Tu cuenta ha sido creada exitosamente." });
      // router.push('/'); // El onAuthStateChanged se encargará de la redirección.
      return true;

    } catch (error: any) {
      let errorMessage = "Ocurrió un error al registrar la cuenta.";
      if (error.code === 'auth/email-already-in-use') errorMessage = "Este correo electrónico ya está en uso.";
      if (error.code === 'auth/weak-password') errorMessage = "La contraseña debe tener al menos 6 caracteres.";
      toast({ title: "Error de registro", description: errorMessage, variant: "destructive" });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    // La función de logout no cambia
    await signOut(auth);
    setUser(defaultVisitor);
    router.push('/');
  };

  // El resto de funciones del contexto (trackInteraction, etc.) no necesitan cambios.
  const trackInteraction = useCallback(async () => {
    if (!user || user.id === 'visitor') return;
    await update(ref(db, `users/${user.id}`), { interactions: increment(1) });
  }, [user]);

  const trackPackOpening = useCallback(async () => {
    if (!user || user.id === 'visitor') return;
    await update(ref(db, `users/${user.id}`), { packsOpened: increment(1) });
  }, [user]);


  return (
    <UserContext.Provider value={{ user, loading, login, register, logout, notifications, setNotifications, availablePacks, setAvailablePacks, nextPackTimestamp, setNextPackTimestamp, countdown, trackInteraction, trackPackOpening }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

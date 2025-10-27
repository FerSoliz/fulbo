'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { ref, onValue, get, update, Unsubscribe } from 'firebase/database';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { RegisterInput } from '@/lib/validators';

const defaultVisitor: User = {
    id: 'visitor',
    name: 'VISITANTE',
    username: 'visitante',
    email: '',
    role: 'player',
    avatar: 'https://avatar.vercel.sh/visitor.png',
    isVerified: false,
    isBlocked: false,
    location: '',
    sudpoints: 0,
    dni: '',
};

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (data: RegisterInput, profileBackground: string) => Promise<boolean>;
  logout: () => Promise<void>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  trackInteraction: () => void;
  // Collectibles state
  availablePacks: number;
  setAvailablePacks: React.Dispatch<React.SetStateAction<number>>;
  nextPackTimestamp: number | null;
  setNextPackTimestamp: React.Dispatch<React.SetStateAction<number | null>>;
  countdown: string;
  trackPackOpening: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [availablePacks, setAvailablePacks] = useState<number>(0);
  const [nextPackTimestamp, setNextPackTimestamp] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribeUser: Unsubscribe = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeUser();
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        unsubscribeUser = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            const dbUser = snapshot.val();
            let userForState: User = { id: firebaseUser.uid, ...dbUser };
            let packsForState = 0;
            let tsForState: number | null = null;

            if (dbUser.collectibles === undefined) {
              console.log(`Usuario sin estructura 'collectibles'. Creando/Migrando para: ${firebaseUser.uid}`);
              
              packsForState = dbUser.availablePacks || 0;
              tsForState = dbUser.nextPackTimestamp || null;

              const newCollectiblesStructure = {
                availablePacks: packsForState,
                nextPackTimestamp: tsForState,
                cardIds: [],
                team: {
                  name: 'Mi Equipo',
                  formation: { starters: Array(5).fill(null), subs: Array(3).fill(null) },
                  showcasedCard: null,
                }
              };
              userForState.collectibles = newCollectiblesStructure;

              const updates: { [key: string]: any } = {
                [`/users/${firebaseUser.uid}/collectibles`]: newCollectiblesStructure,
                [`/users/${firebaseUser.uid}/availablePacks`]: null,
                [`/users/${firebaseUser.uid}/nextPackTimestamp`]: null,
              };
              
              update(ref(db), updates).catch(err => console.error("Error durante la migración/inicialización de datos:", err));
            } else {
              const collectiblesData = dbUser.collectibles || {};
              packsForState = collectiblesData.availablePacks || 0;
              tsForState = collectiblesData.nextPackTimestamp || null;
            }

            if (packsForState < 2 && tsForState === null) {
              console.log(`Usuario ${firebaseUser.uid} elegible para un nuevo sobre. Iniciando temporizador.`);
              const newTimestamp = Date.now() + SIX_HOURS_IN_MS;
              tsForState = newTimestamp;

              if (userForState.collectibles) {
                userForState.collectibles.nextPackTimestamp = newTimestamp;
              } else {
                userForState.collectibles = { nextPackTimestamp: newTimestamp };
              }

              const collectiblesRef = ref(db, `users/${firebaseUser.uid}/collectibles`);
              update(collectiblesRef, { nextPackTimestamp: newTimestamp })
                .catch(err => console.error("Error al iniciar el temporizador proactivo:", err));
            }

            setUser(userForState);
            setAvailablePacks(packsForState);
            setNextPackTimestamp(tsForState);

          } else {
            setUser(null); 
            setAvailablePacks(0);
            setNextPackTimestamp(null);
          }
          setLoading(false);
        });
      } else {
        setUser(defaultVisitor);
        setAvailablePacks(0);
        setNextPackTimestamp(null);
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, []);

  useEffect(() => {
    if (loading) return;

    const publicRoutes = ['/login', '/register', '/forgot-password', '/'];
    const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/tournaments') || pathname.startsWith('/tournament') || pathname.startsWith('/profile') || pathname.startsWith('/ranking');

    if (user?.id === 'visitor' && !isPublicRoute) {
      router.push('/');
    }

  }, [user, loading, pathname, router]);

  useEffect(() => {
    if (!nextPackTimestamp) {
      setCountdown('');
      return;
    }

    const intervalId = setInterval(() => {
      const now = Date.now();
      const timeLeft = nextPackTimestamp - now;

      if (timeLeft <= 0) {
        clearInterval(intervalId);
        setCountdown('');
        if (user && user.id !== 'visitor' && availablePacks < 2) {
           const newPackCount = availablePacks + 1;
           setAvailablePacks(newPackCount);
           const newNextTimestamp = newPackCount < 2 ? Date.now() + SIX_HOURS_IN_MS : null;
           setNextPackTimestamp(newNextTimestamp);
           const collectiblesRef = ref(db, `users/${user.id}/collectibles`);
           update(collectiblesRef, {
               availablePacks: newPackCount,
               nextPackTimestamp: newNextTimestamp
           });
        }
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setCountdown(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [nextPackTimestamp, user, availablePacks]);

  const login = async (email: string, pass: string): Promise<boolean> => {
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

  const register = async (data: RegisterInput, profileBackground: string): Promise<boolean> => {
    const { name, username, email, password, dni } = data;
    setLoading(true);

    try {
      const guestPlayerRef = ref(db, `guestPlayers/${dni}`);
      const guestPlayerSnap = await get(guestPlayerRef);
      
      const isGuestMigration = guestPlayerSnap.exists();
      const guestData = guestPlayerSnap.val();

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const newUserProfile: Omit<User, 'id'> & { collectibles?: any } = {
        name: isGuestMigration ? guestData.name : name,
        username,
        email,
        dni,
        profileBackground,
        avatar: `https://avatar.vercel.sh/${username}.png`,
        role: 'player',
        isVerified: false,
        isBlocked: false,
        location: '',
        sudpoints: isGuestMigration && guestData.sudpoints ? guestData.sudpoints : 0,
        team: isGuestMigration && guestData.team ? guestData.team : null,
        collectibles: {
          availablePacks: 2,
          nextPackTimestamp: null,
          cardIds: [],
          team: {
            name: 'Mi Equipo',
            formation: { starters: Array(5).fill(null), subs: Array(3).fill(null) },
            showcasedCard: null,
          }
        }
      };

      const updates: { [key: string]: any } = {};
      updates[`/users/${uid}`] = newUserProfile;

      if (isGuestMigration) {
        updates[`/guestPlayers/${dni}`] = null; 
      }
      
      await update(ref(db), updates);

      toast({ title: "¡Cuenta Creada!", description: "Tu cuenta ha sido creada exitosamente." });
      return true;

    } catch (error: any) {
      console.error("Firebase Registration Error Details:", error);
      let errorMessage = "Ocurrió un error inesperado.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Este correo electrónico ya está registrado. Por favor, intenta iniciar sesión.";
          break;
        case 'auth/weak-password':
          errorMessage = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
          break;
        case 'auth/invalid-email':
          errorMessage = "El formato del correo electrónico no es válido.";
          break;
        default:
          errorMessage = `Error no identificado. Código: ${error.code}`;
          break;
      }
      toast({ title: "Error de Registro", description: errorMessage, variant: "destructive" });
      setLoading(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(defaultVisitor);
    router.push('/');
  };

  const trackInteraction = useCallback(() => {
    if (user && user.id !== 'visitor') {
      const userRef = ref(db, `users/${user.id}`);
      update(userRef, {
        lastInteraction: new Date().toISOString(),
      }).catch(err => console.error("Failed to track interaction:", err));
    }
  }, [user]);

  const trackPackOpening = useCallback(async () => {
    if (!user || user.id === 'visitor' || availablePacks <= 0) return;

    const newPackCount = availablePacks - 1;
    let newNextTimestamp = nextPackTimestamp;

    if (nextPackTimestamp === null && newPackCount < 2) {
      newNextTimestamp = Date.now() + SIX_HOURS_IN_MS;
    }

    setAvailablePacks(newPackCount);
    setNextPackTimestamp(newNextTimestamp);

    try {
      const collectiblesRef = ref(db, `users/${user.id}/collectibles`);
      await update(collectiblesRef, {
        availablePacks: newPackCount,
        nextPackTimestamp: newNextTimestamp,
      });
    } catch (error) {
      console.error("Failed to update pack data in DB:", error);
      toast({ title: "Error de Sincronización", description: "No se pudo guardar el estado de tus sobres. Intenta de nuevo.", variant: "destructive" });
      setAvailablePacks(availablePacks);
      setNextPackTimestamp(nextPackTimestamp); 
    }
  }, [user, availablePacks, nextPackTimestamp, toast]);

  return (
    <UserContext.Provider value={{
        user, 
        loading, 
        login, 
        register, 
        logout, 
        notifications, 
        setNotifications,
        allUsers,
        setAllUsers,
        setUser,
        trackInteraction,
        availablePacks,
        setAvailablePacks,
        nextPackTimestamp,
        setNextPackTimestamp,
        countdown,
        trackPackOpening
    }}>
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

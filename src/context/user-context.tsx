'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { initialNotifications } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
// --- ¡CORRECCIÓN DE IMPORTACIONES! ---
// 1. Importamos solo los servicios principales desde nuestra configuración de Firebase.
import { auth, db } from '@/lib/firebase'; 
// 2. Importamos las funciones de la base de datos directamente desde el SDK.
import { ref, onValue, get, set } from 'firebase/database';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

const defaultVisitor: User = {
    id: 'visitor',
    name: 'VISITANTE',
    username: 'visitante',
    role: 'player',
    avatar: 'https://avatar.vercel.sh/visitor.png',
    isVerified: false,
    isBlocked: false,
    location: '',
    sudpoints: 0,
    baseSudpoints: 0,
    league: 'Bronce',
    division: 4,
    stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
    interactions: 0,
    packsOpened: 0,
};

interface UserContextType {
  user: User | null;
  allUsers: User[];
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, username: string, email: string, pass: string, dni: string, profileBackground: string) => Promise<boolean>;
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [availablePacks, setAvailablePacks] = useState(0);
  const [nextPackTimestamp, setNextPackTimestamp] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const updateUserInStorage = useCallback(async (updatedUser: User) => {
    // Usamos `db` en lugar de `rtdb`
    const userRef = ref(db, `users/${updatedUser.id}`);
    await set(userRef, updatedUser);
    setAllUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
  }, []);

  useEffect(() => {
    // Usamos `db` en lugar de `rtdb`
    const usersRef = ref(db, 'users');
    const unsubscribe = onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const usersList: User[] = Object.keys(data).map(key => ({ ...data[key], id: key }));
        setAllUsers(usersList);
      } else {
        setAllUsers([]);
      }
    }, (error) => {
      console.error("Error al cargar todos los usuarios de RTDB: ", error);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Usamos `db` en lugar de `rtdb`
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        let foundUser: User | null = null;

        if (snapshot.exists()) {
          foundUser = { ...snapshot.val(), id: firebaseUser.uid };
        } else {
          foundUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Nuevo Usuario',
              username: firebaseUser.displayName?.split(' ')[0].toLowerCase() || `user${Date.now()}`,
              email: firebaseUser.email!,
              avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.email}.png`,
              role: 'player',
              isVerified: firebaseUser.emailVerified,
              isBlocked: false,
              location: 'Desconocida',
              sudpoints: 0,
              baseSudpoints: 0,
              league: 'Bronce',
              division: 4,
              dni: null,
              profileBackground: null,
              sudonepassLevel: null,
              sudonepassExp: null,
              transferStatus: null,
              stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
              interactions: 0,
              packsOpened: 0,
          };
          await set(userRef, foundUser);
        }

        setUser(foundUser!);

        const notifs = JSON.parse(localStorage.getItem(`notifications_${foundUser!.id}`) || 'null');
        setNotifications(notifs || initialNotifications);
        const savedPacksData = localStorage.getItem(`userCardPacksData_${foundUser!.id}`);
        if (savedPacksData) {
            const { packs, timestamp } = JSON.parse(savedPacksData);
            setAvailablePacks(packs);
            setNextPackTimestamp(timestamp);
        } else {
            setAvailablePacks(1);
            setNextPackTimestamp(null);
        }

      } else {
        setUser(defaultVisitor);
        setNotifications([]);
        setAvailablePacks(0);
        setNextPackTimestamp(null);
        setCountdown('');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && user.id !== 'visitor' && notifications.length > 0) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [user, notifications]);

  useEffect(() => {
    if (!user || user.id === 'visitor') return;

    const packsData = { packs: availablePacks, timestamp: nextPackTimestamp };
    localStorage.setItem(`userCardPacksData_${user.id}`, JSON.stringify(packsData));

  }, [availablePacks, nextPackTimestamp, user]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (nextPackTimestamp) {
        const now = Date.now();
        const timeLeft = nextPackTimestamp - now;

        if (timeLeft <= 0) {
          setAvailablePacks(prev => {
            const newPacks = Math.min(2, prev + 1);
            if (newPacks < 2) {
              setNextPackTimestamp(now + SIX_HOURS_IN_MS);
            } else {
              setNextPackTimestamp(null);
            }
            return newPacks;
          });
        } else {
           const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24);
           const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
           const seconds = Math.floor((timeLeft / 1000) % 60);
           setCountdown(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }
      } else {
        setCountdown('');
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextPackTimestamp]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        return true;
    } catch(error: any) {
        console.error(error);
        toast({ title: "Error de inicio de sesión", description: "El correo electrónico o la contraseña son incorrectos.", variant: "destructive" });
        setLoading(false);
        return false;
    }
  };

  const register = async (name: string, username: string, email: string, pass: string, dni: string, profileBackground: string): Promise<boolean> => {
    setLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser: User = {
            id: userCredential.user.uid,
            name: name,
            username: username,
            email: email,
            dni: dni,
            avatar: `https://avatar.vercel.sh/${username}.png`,
            role: 'player',
            isVerified: false,
            isBlocked: false,
            location: 'Desconocida',
            sudpoints: 0,
            baseSudpoints: 0,
            league: 'Bronce',
            division: 4,
            stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
            interactions: 0,
            packsOpened: 0,
            profileBackground: profileBackground,
        };
        // Usamos `db` en lugar de `rtdb`
        await set(ref(db, 'users/' + newUser.id), newUser);
        toast({ title: "¡Cuenta Creada!", description: "Tu cuenta ha sido creada exitosamente." });
        router.push('/');
        return true;
    } catch (error: any) {
        console.error(error);
        let errorMessage = "Ocurrió un error al registrar la cuenta.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este correo electrónico ya está en uso.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "La contraseña debe tener al menos 6 caracteres.";
        }
        toast({ title: "Error de registro", description: errorMessage, variant: "destructive" });
        return false;
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    router.push('/login');
    setLoading(false);
  };

  const trackInteraction = useCallback(async () => {
    if (!user || user.id === 'visitor') return;
    const updatedUser = { ...user, interactions: (user.interactions || 0) + 1 };
    setUser(updatedUser);
    await updateUserInStorage(updatedUser);
  }, [user, updateUserInStorage]);

  const trackPackOpening = useCallback(async () => {
    if (!user || user.id === 'visitor') return;
    const updatedUser = { ...user, packsOpened: (user.packsOpened || 0) + 1 };
    setUser(updatedUser);
    await updateUserInStorage(updatedUser);
  }, [user, updateUserInStorage]);

  const contextValue: UserContextType = {
      user,
      allUsers,
      setUser,
      setAllUsers,
      loading,
      login,
      register,
      logout,
      notifications,
      setNotifications,
      availablePacks,
      setAvailablePacks,
      nextPackTimestamp,
      setNextPackTimestamp,
      countdown,
      trackInteraction,
      trackPackOpening,
  };

  return (
    <UserContext.Provider value={contextValue}>
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

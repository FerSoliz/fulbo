'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { initialNotifications } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase'; 
import { ref, onValue, get, set, update, increment } from 'firebase/database';
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

  useEffect(() => {
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
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        const snapshot = await get(userRef);
        let foundUser: User | null = null;

        if (snapshot.exists()) {
          foundUser = { ...snapshot.val(), id: firebaseUser.uid };
        } else {
          // Si el usuario existe en Auth pero no en la DB, lo creamos (poco común)
          foundUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Nuevo Usuario',
              username: firebaseUser.displayName?.split(' ')[0].toLowerCase() || `user${Date.now()}`,
              email: firebaseUser.email!,
              avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.email}.png`,
              role: 'player', // Rol por defecto
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

        // Lógica para notificaciones y packs

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
  }, []);

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
            role: 'player', // Rol por defecto al registrarse
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
    const userRef = ref(db, `users/${user.id}`);
    try {
      await update(userRef, { interactions: increment(1) });
      setUser(currentUser => 
        currentUser && currentUser.id !== 'visitor' 
        ? { ...currentUser, interactions: (currentUser.interactions || 0) + 1 } 
        : currentUser
      );
    } catch (error) {
      console.error("Error al registrar la interacción: ", error);
    }
  }, [user]);

  const trackPackOpening = useCallback(async () => {
    if (!user || user.id === 'visitor') return;
    const userRef = ref(db, `users/${user.id}`);
    try {
      await update(userRef, { packsOpened: increment(1) });
      setUser(currentUser => 
        currentUser && currentUser.id !== 'visitor'
        ? { ...currentUser, packsOpened: (currentUser.packsOpened || 0) + 1 }
        : currentUser
      );
    } catch (error) {
      console.error("Error al registrar la apertura de sobre: ", error);
    }
  }, [user]);

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

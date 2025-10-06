'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase'; 
import { ref, onValue, get, set, update, increment } from 'firebase/database';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

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
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [availablePacks, setAvailablePacks] = useState(0);
  const [nextPackTimestamp, setNextPackTimestamp] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        
        // Usar onValue para escuchar cambios en el perfil del usuario actual
        const unsubscribeUser = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            setUser({ ...snapshot.val(), id: firebaseUser.uid });
          } else {
            // Esto solo se ejecutará una vez si el usuario no existe en la DB
            const newUserEntry: Omit<User, 'id'> = {
                name: firebaseUser.displayName || 'Nuevo Usuario',
                username: firebaseUser.displayName?.split(' ')[0].toLowerCase() || `user${Date.now()}`,
                email: firebaseUser.email!,
                avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.email}.png`,
                role: 'player',
                isVerified: firebaseUser.emailVerified,
                isBlocked: false, location: '', sudpoints: 0, baseSudpoints: 0, league: 'Bronce', division: 4,
                stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
                interactions: 0, packsOpened: 0,
            };
            set(userRef, newUserEntry);
            setUser({ ...newUserEntry, id: firebaseUser.uid });
          }
          setLoading(false);
        });
        
        return () => unsubscribeUser();
      } else {
        setUser(defaultVisitor);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

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

  const register = async (name: string, username: string, email: string, pass: string, dni: string, profileBackground: string): Promise<boolean> => {
    setLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser: Omit<User, 'id'> = {
            name, username, email, dni, profileBackground,
            avatar: `https://avatar.vercel.sh/${username}.png`,
            role: 'player',
            isVerified: false, isBlocked: false, location: '', sudpoints: 0, baseSudpoints: 0, league: 'Bronce', division: 4,
            stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
            interactions: 0, packsOpened: 0,
        };
        await set(ref(db, 'users/' + userCredential.user.uid), newUser);
        toast({ title: "¡Cuenta Creada!", description: "Tu cuenta ha sido creada exitosamente." });
        router.push('/');
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
    await signOut(auth);
    setUser(defaultVisitor);
    router.push('/login');
  };

  const trackInteraction = useCallback(async () => {
    if (!user || user.id === 'visitor') return;
    const userRef = ref(db, `users/${user.id}`);
    await update(userRef, { interactions: increment(1) });
  }, [user]);

  const trackPackOpening = useCallback(async () => {
    if (!user || user.id === 'visitor') return;
    const userRef = ref(db, `users/${user.id}`);
    await update(userRef, { packsOpened: increment(1) });
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

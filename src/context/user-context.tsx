'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { initialNotifications, initialUsers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { auth, dbRealtime, dbRTExports } from '@/lib/firebase'; // Re-importar dbRealtime y dbRTExports
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const SIX_HOURS_IN_MS = 6 * 60 * 60 * 1000;

const defaultVisitor: User = {
    id: 'visitor',
    name: 'VISITANTE',
    username: 'visitante',
    role: 'user', 
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
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers); 
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [availablePacks, setAvailablePacks] = useState(0);
  const [nextPackTimestamp, setNextPackTimestamp] = useState<number | null>(null);
  const [countdown, setCountdown] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  
  const updateUserInStorage = async (updatedUser: User) => {
    // Actualizar en Realtime Database
    const userRef = dbRTExports.ref(dbRealtime, `users/${updatedUser.id}`);
    await dbRTExports.set(userRef, updatedUser); // Usar set en Realtime Database
    
    // Si necesitas actualizar allUsers en el estado local, hazlo aquí (opcional)
    setAllUsers(prev => prev.map(u => (u.id === updatedUser.id ? updatedUser : u)));
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const userRef = dbRTExports.ref(dbRealtime, `users/${firebaseUser.uid}`);
        const snapshot = await dbRTExports.get(userRef);
        let foundUser: User | null = null;

        if (snapshot.exists()) {
          foundUser = snapshot.val() as User; // Obtener los datos del snapshot
        } else {
          // Si no existe en Realtime DB, creamos un perfil inicial con los datos del registro y valores por defecto
          const initialData = initialUsers.find(u => u.id === firebaseUser.uid || u.email === firebaseUser.email);

          foundUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || initialData?.name || 'Nuevo Usuario',
              username: firebaseUser.displayName?.split(' ')[0].toLowerCase() || initialData?.username || `user${Date.now()}`,
              email: firebaseUser.email!,
              avatar: firebaseUser.photoURL || initialData?.avatar || `https://avatar.vercel.sh/${firebaseUser.email}.png`,
              role: initialData?.role || 'player', // Rol por defecto 'player'
              isVerified: firebaseUser.emailVerified,
              isBlocked: initialData?.isBlocked || false,
              location: initialData?.location || 'Desconocida',
              sudpoints: initialData?.sudpoints || 0,
              baseSudpoints: initialData?.baseSudpoints || 0,
              league: initialData?.league || 'Bronce',
              division: 4,
              dni: initialData?.dni ?? null,
              profileBackground: initialData?.profileBackground ?? null,
              sudonepassLevel: initialData?.sudonepassLevel ?? null,
              sudonepassExp: initialData?.sudonepassExp ?? null,
              transferStatus: initialData?.transferStatus ?? null,
              stats: initialData?.stats || { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
              interactions: initialData?.interactions || 0,
              packsOpened: initialData?.packsOpened || 0,
          };
          await dbRTExports.set(userRef, foundUser); // Guardar el nuevo perfil en Realtime Database
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
        toast({
            title: "Error de inicio de sesión",
            description: "El correo electrónico o la contraseña son incorrectos.",
            variant: "destructive",
        });
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
            role: 'player', // Asignamos el rol 'player' por defecto al registrarse
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
            profileBackground: profileBackground, // Guardar el fondo de perfil seleccionado
        };
        
        await dbRTExports.set(dbRTExports.ref(dbRealtime, 'users/' + newUser.id), newUser);

        setAllUsers(prev => [...prev, newUser]);
        setUser(newUser);
        toast({
          title: "¡Cuenta Creada!",
          description: "Tu cuenta ha sido creada exitosamente.",
        });
        router.push('/');
        return true;
    } catch (error: any) {
        console.error(error);
        let errorMessage = "Ocurrió un error al registrar la cuenta.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este correo electrónico ya está en uso.";
        }
        if (error.code === 'auth/weak-password') {
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
    setUser(defaultVisitor);
    setNotifications([]);
    router.push('/login');
    setLoading(false);
  };
  
  const trackInteraction = useCallback(async () => {
    if (!user || user.id === 'visitor') return;

    const updatedUser = {
      ...user,
      interactions: (user.interactions || 0) + 1,
    };
    setUser(updatedUser);
    await updateUserInStorage(updatedUser);
  }, [user, updateUserInStorage]);

  const trackPackOpening = useCallback(async () => {
    if (!user || user.id === 'visitor') return;

    const updatedUser = {
      ...user,
      packsOpened: (user.packsOpened || 0) + 1,
    };
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

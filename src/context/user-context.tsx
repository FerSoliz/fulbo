'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { initialNotifications } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from '@/lib/firebase';
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
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  // ¡CORREGIDO! Se añade el sexto parámetro para el fondo de perfil.
  register: (name: string, username: string, email: string, pass: string, dni: string, profileBackgroundUrl: string) => Promise<boolean>;
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

  const updateUserInFirestore = useCallback(async (updatedUser: User) => {
    if (!db) {
      console.error("Firestore DB no está inicializada.");
      return;
    }
    try {
      const userRef = doc(db, `users`, updatedUser.id);
      await setDoc(userRef, updatedUser, { merge: true });
      console.log(`Usuario ${updatedUser.id} actualizado en Firestore.`);
    } catch (error) {
      console.error("Error al actualizar usuario en Firestore:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del usuario.",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        if (!db) {
          console.error("Firestore DB no está inicializada al cargar usuario.");
          setUser(defaultVisitor);
          setLoading(false);
          return;
        }

        const userRef = doc(db, `users`, firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        let foundUser: User | null = null;

        if (userDoc.exists()) {
          foundUser = userDoc.data() as User;
          if (!foundUser.role) {
              foundUser = { ...foundUser, role: 'user' };
              await updateDoc(userRef, { role: 'user' });
          }
        } else {
          foundUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Nuevo Usuario',
              username: firebaseUser.displayName?.split(' ')[0].toLowerCase() || `user${Date.now()}`,
              email: firebaseUser.email!,
              avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.email}.png`,
              role: 'user',
              isVerified: firebaseUser.emailVerified,
              isBlocked: false,
              location: 'Desconocida',
              sudpoints: 0,
              baseSudpoints: 0,
              league: 'Bronce',
              division: 4,
              dni: '',
              profileBackground: '',
              sudonepassLevel: 0,
              sudonepassExp: 0,
              transferStatus: 'available',
              stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
              interactions: 0,
              packsOpened: 0,
          };
          await setDoc(userRef, foundUser);
          console.log(`Nuevo usuario ${foundUser.id} creado en Firestore.`);
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
  }, [updateUserInFirestore, toast]);


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

  // ¡CORREGIDO! Se actualiza la firma y la lógica de la función register
  const register = async (name: string, username: string, email: string, pass: string, dni: string, profileBackgroundUrl: string): Promise<boolean> => {
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
            role: 'user', 
            profileBackground: profileBackgroundUrl, // ¡DATO AÑADIDO!
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
        };

        if (!db) {
          throw new Error("La base de datos de Firestore no está disponible.");
        }
        const userRef = doc(db, `users`, newUser.id);
        await setDoc(userRef, newUser); // Guardar el usuario en Firestore
        
        setUser(newUser); // Actualizar el estado del contexto

        // ¡TOAST DE ÉXITO PROFESIONAL!
        toast({
          title: `¡Bienvenido a SUDONE, ${username}!`,
          description: "Tu cuenta ha sido creada exitosamente. Ya puedes iniciar sesión.",
          variant: "default", 
        });

        router.push('/');
        return true;
    } catch (error: any) {
        console.error("Error en el registro:", error);
        let errorMessage = "Ocurrió un error inesperado al registrar la cuenta.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este correo electrónico ya se encuentra registrado.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "La contraseña es muy débil. Debe tener al menos 6 caracteres.";
        }
        toast({ title: "Error de Registro", description: errorMessage, variant: "destructive" });
        return false;
    } finally {
        // ¡IMPORTANTE! Asegurarse de que el loading se detenga siempre.
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
    await updateUserInFirestore(updatedUser);
  }, [user, updateUserInFirestore]);

  const trackPackOpening = useCallback(async () => {
    if (!user || user.id === 'visitor') return;

    const updatedUser = {
      ...user,
      packsOpened: (user.packsOpened || 0) + 1,
    };
    setUser(updatedUser);
    await updateUserInFirestore(updatedUser);
  }, [user, updateUserInFirestore]);

  const contextValue: UserContextType = {
      user,
      setUser,
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
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
}

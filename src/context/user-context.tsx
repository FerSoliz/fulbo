'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { initialNotifications, initialUsers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';


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
};

interface UserContextType {
  user: User | null;
  allUsers: User[];
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, username: string, email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>(initialUsers);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const { toast } = useToast();
  
  useEffect(() => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    setAllUsers(prev => {
        const combined = [...initialUsers, ...storedUsers];
        return Array.from(new Map(combined.map(u => [u.id, u])).values());
    });
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        let foundUser = [...initialUsers, ...storedUsers].find(u => u.email === firebaseUser.email);
        
        if (!foundUser) {
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
                stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
            };
            const updatedUsers = [...storedUsers, foundUser];
            localStorage.setItem('users', JSON.stringify(updatedUsers));
            setAllUsers(prev => [...prev, foundUser]);
        }
        
        setUser(foundUser);
        const notifs = JSON.parse(localStorage.getItem(`notifications_${foundUser.id}`) || 'null');
        setNotifications(notifs || initialNotifications);
      } else {
        setUser(defaultVisitor);
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);


  useEffect(() => {
    if (user && user.id !== 'visitor' && notifications.length > 0) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [user, notifications]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        // onAuthStateChanged will handle setting the user
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
  
  const register = async (name: string, username: string, email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
        const newUser: User = {
            id: userCredential.user.uid,
            name: name,
            username: username,
            email: email,
            avatar: `https://avatar.vercel.sh/${username}.png`,
            role: 'user',
            isVerified: false,
            isBlocked: false,
            location: 'Desconocida',
            sudpoints: 0,
            baseSudpoints: 0,
            league: 'Bronce',
            division: 4,
            stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
        };
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = [...storedUsers, newUser];
        localStorage.setItem('users', JSON.stringify(updatedUsers));
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
    await auth.signOut();
    setUser(defaultVisitor);
    setNotifications([]);
    router.push('/login');
    setLoading(false);
  };
  
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
      setNotifications
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

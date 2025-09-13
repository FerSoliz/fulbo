
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { initialNotifications } from '@/lib/data';

interface UserContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        let foundUser = storedUsers.find((u: User) => u.id === firebaseUser.uid);

        if (foundUser) {
          setUserState(foundUser);
        } else {
          // Si es un usuario nuevo, crea un perfil básico
          const userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'NuevoUsuario';
          const newUser: User = {
            id: firebaseUser.uid,
            name: userName,
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${userName.replace(/\s+/g, '')}.png`,
            role: 'user', // Rol por defecto
            location: 'Desconocida',
            isVerified: firebaseUser.emailVerified,
            sudpoints: 0,
            baseSudpoints: 0,
            league: 'Bronce',
            division: 4,
            stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
          };
          
          const updatedStoredUsers = [...storedUsers, newUser];
          localStorage.setItem('users', JSON.stringify(updatedStoredUsers));
          setUserState(newUser);
        }
        
        const storedNotifications = localStorage.getItem(`notifications_${firebaseUser.uid}`);
        setNotifications(storedNotifications ? JSON.parse(storedNotifications) : initialNotifications);
        

        // Redirige si está en una página de autenticación después de iniciar sesión
        if (pathname === '/login' || pathname === '/register' || pathname === '/forgot-password') {
          router.push('/');
        }

      } else {
        // No hay usuario de Firebase, se establece el usuario en null.
        setUserState(null);
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
    useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user?.id]);


  const logout = async () => {
    await signOut(auth);
    setUserState(null);
    setNotifications([]);
    router.push('/login');
    toast({ title: 'Sesión Cerrada' });
  };
  
  // Función para actualizar manualmente el perfil de usuario
  const setUser = (updatedUser: User | null) => {
      setUserState(updatedUser);
      if (updatedUser) {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const userExists = storedUsers.some((u: User) => u.id === updatedUser.id);
        let newStoredUsers;
        if(userExists) {
            newStoredUsers = storedUsers.map((u: User) => u.id === updatedUser.id ? updatedUser : u);
        } else {
            newStoredUsers = [...storedUsers, updatedUser];
        }
        localStorage.setItem('users', JSON.stringify(newStoredUsers));
      }
  }

  return (
    <UserContext.Provider value={{ user, loading, logout, setUser, notifications, setNotifications }}>
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

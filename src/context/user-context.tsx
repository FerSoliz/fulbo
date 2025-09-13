'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { defaultVisitor, users as initialUsers, initialNotifications } from '@/lib/data';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        setUserState(JSON.parse(savedUser));
      } catch {
        setUserState(defaultVisitor);
      }
    } else {
      setUserState(defaultVisitor);
    }
    setLoading(false);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const isNewUser = firebaseUser.metadata.creationTime === firebaseUser.metadata.lastSignInTime;
        
        const storedUsersJSON = localStorage.getItem('users') || '[]';
        const allKnownUsers = [...initialUsers, ...JSON.parse(storedUsersJSON)];
        let foundUser = allKnownUsers.find(u => u.id === firebaseUser.uid);

        if (foundUser) {
            const updatedUser = {
                ...foundUser,
                name: firebaseUser.displayName || foundUser.name,
                avatar: firebaseUser.photoURL || foundUser.avatar,
                isVerified: firebaseUser.emailVerified || foundUser.isVerified,
            };
            setUserState(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        } else {
            const userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Nuevo Usuario';
            const userAvatar = firebaseUser.photoURL || `https://avatar.vercel.sh/${userName.replace(/\s+/g, '')}.png`;
            const newUser: User = {
                id: firebaseUser.uid,
                name: userName,
                email: firebaseUser.email || '',
                role: 'user',
                avatar: userAvatar,
                location: 'Desconocida',
                isVerified: firebaseUser.emailVerified,
                sudpoints: 0,
                baseSudpoints: 0,
                league: 'Bronce',
                division: 4,
                stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
            };
            const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
            localStorage.setItem('users', JSON.stringify([...storedUsers, newUser]));
            setUserState(newUser);
            localStorage.setItem('currentUser', JSON.stringify(newUser));
        }
        
        if (isNewUser) {
            toast({ title: '¡Cuenta creada!', description: 'Bienvenido a SUDONE.' });
        } else {
            toast({ title: '¡Bienvenido de vuelta!', description: 'Has iniciado sesión correctamente.' });
        }
        router.push('/');

      } else {
        setUserState(defaultVisitor);
        localStorage.removeItem('currentUser');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUserState(defaultVisitor);
    localStorage.clear();
    router.push('/login');
    toast({ title: 'Sesión Cerrada', description: 'Has cerrado sesión correctamente.' });
    setLoading(false);
  };
  
  const setUser = (updatedUser: User | null) => {
      setUserState(updatedUser);
      if(updatedUser && updatedUser.id !== 'visitor-0'){
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      } else {
          localStorage.removeItem('currentUser');
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

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { initialNotifications, initialUsers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface UserContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const defaultVisitor: User = {
    id: 'visitor',
    name: 'VISITANTE',
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

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in. Find them in our user data.
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const allUsers = [...initialUsers, ...storedUsers];
        let foundUser = allUsers.find((u: User) => u.email === firebaseUser.email);

        if (!foundUser) {
          // If not in our DB, create a basic profile
          foundUser = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Nuevo Usuario',
            email: firebaseUser.email!,
            role: 'user',
            avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.email}.png`,
            isVerified: true,
            isBlocked: false,
            location: 'Desconocida',
            sudpoints: 0,
            baseSudpoints: 0,
            league: 'Bronce',
            division: 4,
            stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
          };
          const updatedStoredUsers = [...storedUsers, foundUser];
          localStorage.setItem('users', JSON.stringify(updatedStoredUsers));
        }

        setUserState(foundUser);
        
        const storedNotifications = localStorage.getItem(`notifications_${foundUser.id}`);
        setNotifications(storedNotifications ? JSON.parse(storedNotifications) : initialNotifications);
        
      } else {
        // User is signed out.
        setUserState(defaultVisitor);
        setNotifications([]);
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Persist notifications when they change
    if (user && user.id !== 'visitor') {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  const logout = async () => {
    await auth.signOut();
    setUserState(defaultVisitor);
    setNotifications([]);
    toast({ title: 'Sesión Cerrada' });
  };


  return (
    <UserContext.Provider value={{ user, loading, logout, notifications, setNotifications }}>
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

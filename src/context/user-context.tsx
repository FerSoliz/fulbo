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
  const [authLoading, setAuthLoading] = useState(true); // Separate state for auth readiness
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthLoading(true);
      if (firebaseUser) {
        // User is signed in
        const storedUsersJSON = localStorage.getItem('users') || '[]';
        const allKnownUsers = [...initialUsers, ...JSON.parse(storedUsersJSON)];
        let foundUser = allKnownUsers.find(u => u.id === firebaseUser.uid);

        if (foundUser) {
          // Update existing user with latest from Firebase
           const updatedUser = {
                ...foundUser,
                name: firebaseUser.displayName || foundUser.name,
                email: firebaseUser.email || foundUser.email,
                avatar: firebaseUser.photoURL || foundUser.avatar,
                isVerified: firebaseUser.emailVerified || foundUser.isVerified,
            };
            setUserState(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        } else {
          // New user, create a profile
          const userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Nuevo Usuario';
          const newUser: User = {
            id: firebaseUser.uid,
            name: userName,
            email: firebaseUser.email || '',
            role: 'user',
            avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${userName.replace(/\s+/g, '')}.png`,
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
      } else {
        // User is signed out
        setUserState(defaultVisitor);
        localStorage.setItem('currentUser', JSON.stringify(defaultVisitor));
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUserState(defaultVisitor);
    localStorage.setItem('currentUser', JSON.stringify(defaultVisitor)); // Set to visitor on logout
    router.push('/login');
    toast({ title: 'Sesión Cerrada', description: 'Has cerrado sesión correctamente.' });
  };
  
  const setUser = (updatedUser: User | null) => {
      setUserState(updatedUser);
      if(updatedUser){
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      } else {
          // This case should ideally not happen, fallback to visitor
          localStorage.setItem('currentUser', JSON.stringify(defaultVisitor));
      }
  }

  return (
    <UserContext.Provider value={{ user, loading: authLoading, logout, setUser, notifications, setNotifications }}>
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

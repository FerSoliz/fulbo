'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Notification } from '@/lib/data';
import { defaultVisitor, users as initialUsers, initialNotifications } from '@/lib/data';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

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
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // User is signed in.
        const allKnownUsersJSON = localStorage.getItem('users') || '[]';
        const allKnownUsers = [...initialUsers, ...JSON.parse(allKnownUsersJSON)];
        
        let foundUser = allKnownUsers.find(u => u.email === firebaseUser.email);
        
        if (foundUser) {
            setUserState(foundUser);
            localStorage.setItem('currentUser', JSON.stringify(foundUser));
        } else {
            // This is a new Firebase user not in our mock data. Create a basic profile.
            const newUser: User = {
              id: `user-${Date.now()}`,
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Nuevo Usuario',
              email: firebaseUser.email || '',
              role: 'user',
              avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.email}.png`,
              location: 'Desconocida',
              isVerified: false,
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
        // User is signed out.
        setUserState(defaultVisitor);
        localStorage.removeItem('currentUser');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const logout = async () => {
    await signOut(auth); 
    setUserState(defaultVisitor); // Set to visitor immediately
    localStorage.removeItem('currentUser');
    window.location.reload();
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

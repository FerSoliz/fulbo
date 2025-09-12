'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, Notification } from '@/lib/data';
import { defaultVisitor, users as initialUsers, initialNotifications } from '@/lib/data';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';

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
        const storedUsersJSON = localStorage.getItem('users') || '[]';
        const storedUsers: User[] = JSON.parse(storedUsersJSON);
        const allKnownUsers = [...initialUsers, ...storedUsers];
        
        let foundUser = allKnownUsers.find(u => u.email === firebaseUser.email);
        
        if (foundUser) {
            setUserState(foundUser);
        } else {
            // This is a new Firebase user not in our local data. Create and save a basic profile.
            const newUser: User = {
              id: firebaseUser.uid, // Use Firebase UID for consistency
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
            
            // Add the new user to our list of custom users and save it
            const updatedStoredUsers = [...storedUsers, newUser];
            localStorage.setItem('users', JSON.stringify(updatedStoredUsers));
            
            // Set the new user as the active user
            setUserState(newUser);
        }
      } else {
        // User is signed out. Force admin user for dev purposes.
        const adminUser = initialUsers.find(u => u.role === 'admin');
        setUserState(adminUser || defaultVisitor);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const logout = async () => {
    await signOut(auth); 
    setUserState(defaultVisitor);
  };
  
  const setUser = (updatedUser: User | null) => {
      setUserState(updatedUser);
      if (updatedUser && updatedUser.id !== 'visitor-0') {
         // Persist changes to the current user in the full user list
         const storedUsersJSON = localStorage.getItem('users') || '[]';
         let storedUsers: User[] = JSON.parse(storedUsersJSON);
         const userIndex = storedUsers.findIndex(u => u.id === updatedUser.id);
         if (userIndex > -1) {
             storedUsers[userIndex] = updatedUser;
         } else if (!initialUsers.some(u => u.id === updatedUser.id)) {
            // It's a new custom user or an updated one not in the initial list
             storedUsers.push(updatedUser);
         }
         localStorage.setItem('users', JSON.stringify(storedUsers));
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

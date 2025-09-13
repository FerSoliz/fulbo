'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // User is signed in.
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const allKnownUsers: User[] = [...initialUsers, ...storedUsers];
        let foundUser = allKnownUsers.find(u => u.id === firebaseUser.uid);

        if (foundUser) {
          // Existing user, update session.
          setUserState(foundUser);
        } else {
          // New user (registered). Create a local profile.
          const userName = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Nuevo Usuario';
          const newUser: User = {
            id: firebaseUser.uid,
            name: userName,
            email: firebaseUser.email || '',
            avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${userName.replace(/\s+/g, '')}.png`,
            role: 'user', // Default role
            location: 'Desconocida',
            isVerified: firebaseUser.emailVerified,
            sudpoints: 0,
            baseSudpoints: 0,
            league: 'Bronce',
            division: 4,
            stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
          };

          // Save new user to localStorage
          localStorage.setItem('users', JSON.stringify([...storedUsers, newUser]));
          setUserState(newUser);
        }
        
        // Redirect if they are on an auth page
        if (pathname === '/login' || pathname === '/register') {
            toast({ title: '¡Bienvenido!', description: 'Has iniciado sesión correctamente.' });
            router.push('/');
        }

      } else {
        // User is signed out.
        setUserState(defaultVisitor);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router]);

  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will handle setting the user to visitor
    router.push('/login');
    toast({ title: 'Sesión Cerrada', description: 'Has cerrado sesión correctamente.' });
  };
  
  // This function is for manual updates to user profile, e.g. linking account
  const setUser = (updatedUser: User | null) => {
      setUserState(updatedUser);
      // Persist this manual change
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

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, isMockConfig } from '@/lib/firebase';
import type { User, Notification } from '@/lib/data';
import { initialNotifications, initialUsers } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
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
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Load all non-Firebase user data from storage/initial data
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const combinedUsers = [...initialUsers, ...storedUsers];
    const uniqueUsers = Array.from(new Map(combinedUsers.map(u => [u.id, u])).values());
    setAllUsers(uniqueUsers);

    if (isMockConfig) {
      console.log("Using mock auth flow.");
      const loggedInUserId = localStorage.getItem('loggedInUserId');
      if (loggedInUserId) {
        const foundUser = uniqueUsers.find((u:User) => u.id === loggedInUserId);
        if (foundUser) {
          setUser(foundUser);
          const storedNotifications = localStorage.getItem(`notifications_${foundUser.id}`);
          setNotifications(storedNotifications ? JSON.parse(storedNotifications) : initialNotifications);
        } else {
          setUser(defaultVisitor);
        }
      } else {
        setUser(defaultVisitor);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // User is signed in. Find matching user in our data or create a new one.
        let appUser = uniqueUsers.find((u: User) => u.email === fbUser.email);
        
        if (!appUser) {
          appUser = {
            id: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Nuevo Usuario',
            email: fbUser.email || '',
            role: 'user',
            avatar: fbUser.photoURL || `https://avatar.vercel.sh/${fbUser.uid}.png`,
            isVerified: fbUser.emailVerified,
            isBlocked: false,
            location: 'Desconocida',
            sudpoints: 0,
            baseSudpoints: 0,
            league: 'Bronce',
            division: 4,
            stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
          };
          const newAllUsers = [...allUsers, appUser];
          setAllUsers(newAllUsers);
        }
        
        setUser(appUser);
        const storedNotifications = localStorage.getItem(`notifications_${appUser.id}`);
        setNotifications(storedNotifications ? JSON.parse(storedNotifications) : initialNotifications);
        localStorage.setItem('loggedInUserId', appUser.id);
      } else {
        // User is signed out
        setUser(defaultVisitor);
        setFirebaseUser(null);
        setNotifications([]);
        localStorage.removeItem('loggedInUserId');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Persist allUsers whenever it changes, filtering out initial ones
    if(allUsers.length > 0) {
        const customUsers = allUsers.filter(u => !initialUsers.some(iu => iu.id === u.id));
        localStorage.setItem('users', JSON.stringify(customUsers));
    }
  }, [allUsers]);

  useEffect(() => {
    // Persist notifications when they change for the logged-in user
    if (user && user.id !== 'visitor') {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    // This function is now only for the mock flow, as onAuthStateChanged handles real login
    const foundUser = allUsers.find(u => u.email === email && u.password === pass);
    if (foundUser) {
      if (foundUser.isBlocked) {
        toast({ title: "Cuenta Bloqueada", description: "Esta cuenta ha sido bloqueada.", variant: "destructive"});
        return false;
      }
      localStorage.setItem('loggedInUserId', foundUser.id);
      setUser(foundUser);
      const storedNotifications = localStorage.getItem(`notifications_${foundUser.id}`);
      setNotifications(storedNotifications ? JSON.parse(storedNotifications) : initialNotifications);
      return true;
    }
    return false;
  };

  const logout = async () => {
    if (!isMockConfig) {
      await auth.signOut();
    }
    // The onAuthStateChanged listener will handle resetting the state
    setUser(defaultVisitor);
    setNotifications([]);
    localStorage.removeItem('loggedInUserId');
    toast({ title: 'Sesión Cerrada' });
    router.push('/login');
  };

  const contextValue = {
      user,
      firebaseUser,
      allUsers,
      setAllUsers,
      loading,
      login,
      logout,
      notifications,
      setNotifications,
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


'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { initialNotifications, initialUsers, defaultVisitor } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
  user: User | null;
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // Load all user data from storage/initial data
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const combinedUsers = [...initialUsers, ...storedUsers];
    const uniqueUsers = Array.from(new Map(combinedUsers.map(u => [u.id, u])).values());
    setAllUsers(uniqueUsers);

    // Check for a logged-in user
    const loggedInUserId = localStorage.getItem('loggedInUserId');
    if (loggedInUserId) {
        const foundUser = uniqueUsers.find((u:User) => u.id === loggedInUserId);
        if (foundUser) {
          setUser(foundUser);
          const storedNotifications = localStorage.getItem(`notifications_${foundUser.id}`);
          setNotifications(storedNotifications ? JSON.parse(storedNotifications) : initialNotifications);
        } else {
            // If user in localStorage is not found, default to visitor
            setUser(defaultVisitor);
            localStorage.removeItem('loggedInUserId');
        }
    } else {
        setUser(defaultVisitor);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Persist allUsers whenever it changes, filtering out initial ones that haven't been modified
    if(allUsers.length > 0) {
        const customUsers = allUsers.filter(u => !initialUsers.some(iu => iu.id === u.id && JSON.stringify(iu) === JSON.stringify(u)));
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

  const logout = () => {
    setUser(defaultVisitor);
    setNotifications([]);
    localStorage.removeItem('loggedInUserId');
    toast({ title: 'Sesión Cerrada' });
    router.push('/login');
  };

  const contextValue = {
      user,
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

    
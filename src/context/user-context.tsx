'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { initialNotifications, users as initialUsersData } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
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

  const initializeData = useCallback(() => {
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) {
        localStorage.setItem('users', JSON.stringify(initialUsersData));
    }
    const currentUser = localStorage.getItem('currentUser');
    if(currentUser){
        const parsedUser = JSON.parse(currentUser);
        setUserState(parsedUser);
        const storedNotifications = localStorage.getItem(`notifications_${parsedUser.id}`);
        setNotifications(storedNotifications ? JSON.parse(storedNotifications) : initialNotifications);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user?.id]);

  const login = (email: string, pass: string): boolean => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = storedUsers.find((u: User) => u.email === email && u.password === pass);

    if (foundUser) {
      if (foundUser.isBlocked) {
        toast({
          title: "Acceso Denegado",
          description: "Esta cuenta ha sido bloqueada.",
          variant: "destructive"
        });
        return false;
      }
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      setUserState(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUserState(null);
    setNotifications([]);
    router.push('/login');
    toast({ title: 'Sesión Cerrada' });
  };

  const setUser = (updatedUser: User | null) => {
    setUserState(updatedUser);
    if(updatedUser){
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const updatedUsers = storedUsers.map((u:User) => u.id === updatedUser.id ? updatedUser : u);
        localStorage.setItem('users', JSON.stringify(updatedUsers));
    } else {
        localStorage.removeItem('currentUser');
    }
  };

  return (
    <UserContext.Provider value={{ user, loading, login, logout, setUser, notifications, setNotifications }}>
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

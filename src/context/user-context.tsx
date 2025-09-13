'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { initialNotifications, initialUsers } from '@/lib/data';
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

  useEffect(() => {
    // Cargar usuarios desde localStorage o inicializarlos si no existen
    const storedUsers = localStorage.getItem('users');
    if (!storedUsers) {
      localStorage.setItem('users', JSON.stringify([])); // Start with empty array for custom users
    }

    // Cargar el usuario actual de la sesión
    const currentUserJSON = localStorage.getItem('currentUser');
    if (currentUserJSON) {
      const loggedInUser = JSON.parse(currentUserJSON);
      setUserState(loggedInUser);
      // Cargar notificaciones para el usuario logueado
      const storedNotifications = localStorage.getItem(`notifications_${loggedInUser.id}`);
      setNotifications(storedNotifications ? JSON.parse(storedNotifications) : initialNotifications);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Persistir notificaciones cuando cambian
    if (user?.id) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user?.id]);

  const login = (email: string, pass: string): boolean => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const allUsers = [...initialUsers, ...storedUsers];
    const foundUser = allUsers.find((u: User) => u.email === email && u.password === pass);

    if (foundUser) {
      if (foundUser.isBlocked) {
        toast({
          title: "Acceso Denegado",
          description: "Esta cuenta ha sido bloqueada por un administrador.",
          variant: "destructive"
        });
        return false;
      }
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      setUserState(foundUser);
      // Cargar notificaciones para el nuevo usuario que inicia sesión
      const storedNotifications = localStorage.getItem(`notifications_${foundUser.id}`);
      setNotifications(storedNotifications ? JSON.parse(storedNotifications) : initialNotifications);
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
    if (updatedUser) {
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      // Actualizar también la lista completa de usuarios en localStorage
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const updatedUsers = storedUsers.map((u: User) => (u.id === updatedUser.id ? updatedUser : u));
      // If user not found in stored, add them (for initial users being updated)
      if (!updatedUsers.some((u: User) => u.id === updatedUser.id)) {
          // But only add if it's not one of the initial users
          if(!initialUsers.some(iu => iu.id === updatedUser.id)) {
            updatedUsers.push(updatedUser);
          }
      }
      localStorage.setItem('users', JSON.stringify(updatedUsers.filter((u:User) => !initialUsers.some(iu => iu.id === u.id))));
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

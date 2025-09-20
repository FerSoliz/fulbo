'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { initialNotifications, initialUsers, defaultVisitor } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser
} from 'firebase/auth';

interface UserContextType {
  user: User | null;
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
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

  const updateUserAndStorage = (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const combinedUsers = [...initialUsers, ...storedUsers];
        const uniqueUsers = Array.from(new Map(combinedUsers.map(u => [u.id, u])).values());
        setAllUsers(uniqueUsers);

        let appUser = uniqueUsers.find((u: User) => u.email === firebaseUser.email);

        if (appUser) {
            if (appUser.isBlocked) {
                toast({ title: "Cuenta Bloqueada", description: "Esta cuenta ha sido bloqueada.", variant: "destructive"});
                signOut(auth);
                return;
            }
            setUser(appUser);
            const storedNotifications = localStorage.getItem(`notifications_${appUser.id}`);
            setNotifications(storedNotifications ? JSON.parse(storedNotifications) : initialNotifications);
        } else {
            // New user signed up (e.g., via Google)
            const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Nuevo Usuario',
                email: firebaseUser.email!,
                role: 'user',
                avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.uid}.png`,
                isVerified: firebaseUser.emailVerified,
                isBlocked: false,
                location: 'Desconocida',
                sudpoints: 0,
                baseSudpoints: 0,
                league: 'Bronce',
                division: 4,
                stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
            };
            setAllUsers(prev => [...prev, newUser]);
            setUser(newUser);
            setNotifications(initialNotifications);
        }
    } else {
        // User is signed out
        setUser(defaultVisitor);
        setNotifications([]);
        localStorage.removeItem('loggedInUserId');
    }
    setLoading(false);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, updateUserAndStorage);
    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allUsers.length > 0) {
      const customUsers = allUsers.filter(u => !initialUsers.some(iu => iu.id === u.id));
      localStorage.setItem('users', JSON.stringify(customUsers));
    }
  }, [allUsers]);

  useEffect(() => {
    if (user && user.id !== 'visitor') {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      return true;
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Ocurrió un error al iniciar sesión.";
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = "El correo electrónico o la contraseña son incorrectos.";
      }
      toast({ title: "Error de inicio de sesión", description: errorMessage, variant: "destructive" });
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
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

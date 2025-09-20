'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Notification } from '@/lib/data';
import { initialNotifications, initialUsers, defaultVisitor } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';


interface UserContextType {
  user: User | null;
  allUsers: User[];
  setAllUsers: React.Dispatch<React.SetStateAction<User[]>>;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (name: string, username: string, email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userId: string, userData: Partial<Omit<User, 'id'>>) => Promise<void>;
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
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const combinedUsers = [...initialUsers, ...storedUsers];
    const uniqueUsers = Array.from(new Map(combinedUsers.map(u => [u.id, u])).values());
    setAllUsers(uniqueUsers);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const appUser = allUsers.find(u => u.id === firebaseUser.uid);
         if (appUser) {
             if (appUser.isBlocked) {
                toast({ title: "Cuenta Bloqueada", description: "Esta cuenta ha sido bloqueada.", variant: "destructive"});
                signOut(auth);
                setUser(defaultVisitor);
             } else {
                setUser(appUser);
                const notifs = JSON.parse(localStorage.getItem(`notifications_${appUser.id}`) || 'null');
                setNotifications(notifs || initialNotifications);
             }
         } else {
            // New user signed in (e.g. via Google), but not yet in our allUsers state
            const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Nuevo Usuario',
                username: firebaseUser.email?.split('@')[0] || `user${Date.now()}`,
                email: firebaseUser.email!,
                role: 'user',
                avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${firebaseUser.email?.split('@')[0]}.png`,
                isVerified: firebaseUser.emailVerified,
                isBlocked: false,
                location: 'Desconocida',
                sudpoints: 0,
                baseSudpoints: 0,
                league: 'Bronce',
                division: 4,
                stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
            };
            setUser(newUser);
            setAllUsers(prev => [...prev, newUser]);
            setNotifications(initialNotifications);
         }
      } else {
        setUser(defaultVisitor);
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    // Persist all non-initial users to localStorage whenever allUsers changes
    const usersToStore = allUsers.filter(u => !initialUsers.some(iu => iu.id === u.id));
    if(usersToStore.length > 0 || localStorage.getItem('users')) {
      localStorage.setItem('users', JSON.stringify(usersToStore));
    }
  }, [allUsers]);

  useEffect(() => {
    if (user && user.id !== 'visitor') {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(notifications));
    }
  }, [notifications, user]);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
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
      setLoading(false);
      return false;
    }
  };
  
  const register = async (name: string, username: string, email: string, password: string): Promise<boolean> => {
    setLoading(true);
     try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const avatarUrl = `https://avatar.vercel.sh/${username.replace(/\s+/g, '')}.png`;
        
        await updateProfile(userCredential.user, {
            displayName: name,
            photoURL: avatarUrl
        });

        const newUser: User = {
            id: userCredential.user.uid,
            name: name,
            username: username,
            email: email,
            role: 'user',
            avatar: avatarUrl,
            isVerified: false,
            isBlocked: false,
            location: 'Desconocida',
            sudpoints: 0,
            baseSudpoints: 0,
            league: 'Bronce',
            division: 4,
            stats: { partidosJugados: 0, victorias: 0, empates: 0, derrotas: 0, goles: 0, asistencias: 0, amarillas: 0, rojas: 0, mvps: 0 },
        };
        
        setUser(newUser);
        setAllUsers(prev => [...prev, newUser]);
        
        toast({ title: "¡Cuenta Creada!", description: "Tu cuenta ha sido creada exitosamente." });
        return true;

    } catch (error: any) {
        console.error(error);
        let errorMessage = "Ocurrió un error al registrar la cuenta.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Este correo electrónico ya está en uso.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "La contraseña debe tener al menos 6 caracteres.";
        }
        toast({ title: "Error de registro", description: errorMessage, variant: "destructive" });
        return false;
    } finally {
        setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  const updateUser = async (userId: string, dataToUpdate: Partial<Omit<User, 'id'>>) => {
     try {
        setAllUsers(prev => prev.map(u => u.id === userId ? {...u, ...dataToUpdate} : u));
        if (currentUser?.id === userId) {
            setUser(prev => prev ? {...prev, ...dataToUpdate} : null);
        }

        if (auth.currentUser && auth.currentUser.uid === userId) {
            if(dataToUpdate.name || dataToUpdate.avatar) {
               await updateProfile(auth.currentUser, {
                  displayName: dataToUpdate.name,
                  photoURL: dataToUpdate.avatar,
                });
            }
         }
     } catch (error) {
        console.error("Error updating user:", error);
        toast({ title: 'Error', description: 'No se pudo actualizar el perfil.', variant: 'destructive'})
     }
  }

  const contextValue: UserContextType = {
      user,
      allUsers,
      setAllUsers,
      loading,
      login,
      register,
      logout,
      updateUser,
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

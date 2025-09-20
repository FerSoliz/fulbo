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
  User as FirebaseUser
} from 'firebase/auth';

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

  const loadInitialData = () => {
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const combinedUsers = [...initialUsers, ...storedUsers];
    const uniqueUsers = Array.from(new Map(combinedUsers.map(u => [u.id, u])).values());
    setAllUsers(uniqueUsers);
    return uniqueUsers;
  };

  const updateUserAndStorage = (firebaseUser: FirebaseUser | null, allUsersList: User[]) => {
    if (firebaseUser) {
        let appUser = allUsersList.find((u: User) => u.id === firebaseUser.uid);

        if (appUser) {
            if (appUser.isBlocked) {
                toast({ title: "Cuenta Bloqueada", description: "Esta cuenta ha sido bloqueada.", variant: "destructive"});
                signOut(auth);
                return;
            }
             // Sync Firebase Auth data with local data if it's different
            const updatedAppUser = {
                ...appUser,
                name: firebaseUser.displayName || appUser.name,
                avatar: firebaseUser.photoURL || appUser.avatar,
                email: firebaseUser.email || appUser.email,
            };
            setUser(updatedAppUser);

            const storedNotifications = localStorage.getItem(`notifications_${appUser.id}`);
            setNotifications(storedNotifications ? JSON.parse(storedNotifications) : initialNotifications);
        } else {
            // New user signed up (e.g., via Google)
            const username = firebaseUser.email?.split('@')[0] || `user${Date.now()}`;
            const newUser: User = {
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Nuevo Usuario',
                username: username,
                email: firebaseUser.email!,
                role: 'user',
                avatar: firebaseUser.photoURL || `https://avatar.vercel.sh/${username}.png`,
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
        setUser(defaultVisitor);
        setNotifications([]);
    }
    setLoading(false);
  }

  useEffect(() => {
    const allUsersList = loadInitialData();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      updateUserAndStorage(firebaseUser, allUsersList);
    });
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
  
  const register = async (name: string, username: string, email: string, password: string):Promise<boolean> => {
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
        
        setAllUsers(prevUsers => [...prevUsers, newUser]);
        setUser(newUser);

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
        setLoading(false);
        return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };
  
  const updateUser = async (userId: string, dataToUpdate: Partial<Omit<User, 'id'>>) => {
     if (auth.currentUser && auth.currentUser.uid === userId) {
        if(dataToUpdate.name || dataToUpdate.avatar) {
           await updateProfile(auth.currentUser, {
              displayName: dataToUpdate.name,
              photoURL: dataToUpdate.avatar,
            });
        }
     }
     
     let updatedUser: User | null = null;
     const newAllUsers = allUsers.map(u => {
        if(u.id === userId) {
            updatedUser = { ...u, ...dataToUpdate };
            return updatedUser;
        }
        return u;
     });
     setAllUsers(newAllUsers);

     if(user && user.id === userId && updatedUser) {
        setUser(updatedUser);
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

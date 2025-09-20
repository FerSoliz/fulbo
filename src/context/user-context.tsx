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
import { doc, setDoc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';


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
    // Listener for all users
    const usersCollectionRef = collection(db, "users");
    const unsubscribeUsers = onSnapshot(usersCollectionRef, (snapshot) => {
      const usersData = snapshot.docs.map(doc => doc.data() as User);
      setAllUsers(usersData);
      
      // Update current user state if they are in the updated list
      if (auth.currentUser) {
        const updatedCurrentUser = usersData.find(u => u.id === auth.currentUser!.uid);
        if (updatedCurrentUser) {
          setUser(updatedCurrentUser);
        }
      }
    });

    // Listener for Auth state
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true);
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const appUser = userSnap.data() as User;
          if (appUser.isBlocked) {
              toast({ title: "Cuenta Bloqueada", description: "Esta cuenta ha sido bloqueada.", variant: "destructive"});
              signOut(auth);
              setUser(defaultVisitor);
          } else {
              setUser(appUser);
              // Load notifications for the logged-in user
              const notifs = JSON.parse(localStorage.getItem(`notifications_${appUser.id}`) || 'null');
              setNotifications(notifs || initialNotifications);
          }
        } else {
           // This case handles users created via Google Sign-In for the first time
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
            await setDoc(userRef, newUser);
            setUser(newUser);
            setNotifications(initialNotifications);
        }
      } else {
        setUser(defaultVisitor);
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
    };
  }, []);
  
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
        
        // Update Firebase Auth Profile
        await updateProfile(userCredential.user, {
            displayName: name,
            photoURL: avatarUrl
        });

        // Create user document in Firestore
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
        await setDoc(doc(db, "users", newUser.id), newUser);
        
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
        // Update Firestore document
        const userRef = doc(db, "users", userId);
        await setDoc(userRef, dataToUpdate, { merge: true });

        // Also update Firebase Auth profile if name or avatar is changed
        if (auth.currentUser && auth.currentUser.uid === userId) {
            if(dataToUpdate.name || dataToUpdate.avatar) {
               await updateProfile(auth.currentUser, {
                  displayName: dataToUpdate.name,
                  photoURL: dataToUpdate.avatar,
                });
            }
         }
         // The onSnapshot listener will automatically update the local state
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

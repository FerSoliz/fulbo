'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
// --- IMPORTACIÓN CORREGIDA ---
import type { User, Notification } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase'; 
import { ref, onValue, get, update, Unsubscribe } from 'firebase/database';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { RegisterInput } from '@/lib/validators';

const defaultVisitor: User = {
    id: 'visitor',
    name: 'VISITANTE',
    username: 'visitante',
    email: '',
    role: 'player',
    avatar: 'https://avatar.vercel.sh/visitor.png',
    isVerified: false,
    isBlocked: false,
    location: '',
    sudpoints: 0,
    dni: '',
};

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  register: (data: RegisterInput, profileBackground: string) => Promise<boolean>;
  logout: () => Promise<void>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  // ... (otros campos si los tienes)
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    let unsubscribeUser: Unsubscribe = () => {};
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeUser();
      if (firebaseUser) {
        const userRef = ref(db, `users/${firebaseUser.uid}`);
        unsubscribeUser = onValue(userRef, (snapshot) => {
          if (snapshot.exists()) {
            // Aseguramos que los datos coincidan con el tipo User
            const dbUser = snapshot.val();
            setUser({ 
              id: firebaseUser.uid,
              ...dbUser
            });
          } else {
             setUser(null); 
          }
          setLoading(false);
        });
      } else {
        setUser(defaultVisitor);
        setLoading(false);
      }
    });
    return () => {
      unsubscribeAuth();
      unsubscribeUser();
    };
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    setLoading(true);
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        router.push('/');
        return true;
    } catch(error: any) {
        toast({ title: "Error de inicio de sesión", description: "El correo electrónico o la contraseña son incorrectos.", variant: "destructive" });
        setLoading(false);
        return false;
    }
  };

  const register = async (data: RegisterInput, profileBackground: string): Promise<boolean> => {
    const { name, username, email, password, dni } = data;
    setLoading(true);

    try {
      const guestPlayerRef = ref(db, `guestPlayers/${dni}`);
      const guestPlayerSnap = await get(guestPlayerRef);
      
      const isGuestMigration = guestPlayerSnap.exists();
      const guestData = guestPlayerSnap.val();

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      // --- CONSTRUCCIÓN DEL PERFIL CON EL TIPO CORRECTO Y CENTRALIZADO ---
      const newUserProfile: Omit<User, 'id'> = {
        name: isGuestMigration ? guestData.name : name,
        username,
        email,
        dni,
        profileBackground,
        avatar: `https://avatar.vercel.sh/${username}.png`,
        role: 'player',
        isVerified: false,
        isBlocked: false,
        location: '',
        sudpoints: isGuestMigration && guestData.sudpoints ? guestData.sudpoints : 0,
        team: isGuestMigration && guestData.team ? guestData.team : null,
      };

      const updates: { [key: string]: any } = {};
      updates[`/users/${uid}`] = newUserProfile;

      if (isGuestMigration) {
        updates[`/guestPlayers/${dni}`] = null; 
      }
      
      await update(ref(db), updates);

      toast({ title: "¡Cuenta Creada!", description: "Tu cuenta ha sido creada exitosamente." });
      return true;

    } catch (error: any) {
      console.error("Firebase Registration Error Details:", error);
      let errorMessage = "Ocurrió un error inesperado.";
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Este correo electrónico ya está registrado. Por favor, intenta iniciar sesión.";
          break;
        case 'auth/weak-password':
          errorMessage = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
          break;
        case 'auth/invalid-email':
          errorMessage = "El formato del correo electrónico no es válido.";
          break;
        default:
          errorMessage = `Error no identificado. Código: ${error.code}`;
          break;
      }
      toast({ title: "Error de Registro", description: errorMessage, variant: "destructive" });
      setLoading(false); // Asegúrate de que el loading se detenga en caso de error
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(defaultVisitor);
    router.push('/');
  };

  // Necesitarás ajustar estos valores si no están en la interfaz UserContextType
  const dummySetState = () => {};
  const dummyTrack = () => {};

  return (
    <UserContext.Provider value={{ 
        user, 
        loading, 
        login, 
        register, 
        logout, 
        notifications, 
        setNotifications,
        // Añade aquí las propiedades que faltan si es necesario
    }}>
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

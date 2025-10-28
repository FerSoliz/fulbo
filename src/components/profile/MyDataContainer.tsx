'use client';

import { useUser } from '@/context/user-context';
import { MyDataModal } from './MyDataModal';
import { MyDataView } from './MyDataView';
import { User as UserProfile } from '@/lib/types';

interface MyDataContainerProps {
  profileUser: UserProfile;
  onClose: () => void;
  onSave: (updatedData: Partial<UserProfile>) => void;
}

export function MyDataContainer({ profileUser, onClose, onSave }: MyDataContainerProps) {
  const { user: currentUser } = useUser();

  // Comprobamos si el perfil que se está viendo pertenece al usuario que ha iniciado sesión
  const isOwnProfile = currentUser?.id === profileUser.id;

  if (isOwnProfile) {
    // Si es su propio perfil, muestra el modal de edición.
    return <MyDataModal profileUser={profileUser} onClose={onClose} onSave={onSave} />;
  }

  // Si es el perfil de otra persona, muestra la vista de solo lectura.
  return <MyDataView profileUser={profileUser} onClose={onClose} />;
}


'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserProfile } from '@/lib/types';
import React from 'react';

interface EditProfileDialogProps {
  user: UserProfile;
  onSave: (updatedUser: Partial<UserProfile>) => void;
  children: React.ReactNode;
}

export const EditProfileDialog = ({ user, onSave, children }: EditProfileDialogProps) => {
  const [username, setUsername] = useState(user.username);
  const [phone, setPhone] = useState(user.phone || '');

  useEffect(() => {
    setUsername(user.username);
    setPhone(user.phone || '');
  }, [user]);

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value.length <= 15) {
      setUsername(e.target.value);
    }
  };

  const handleSave = () => {
    onSave({ username, phone });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Perfil</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre y Apellido (no editable)</Label>
            <Input id="name" value={user.name} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de Usuario</Label>
            <Input id="username" value={username} onChange={handleUsernameChange} />
            <p className="text-xs text-muted-foreground">Máximo 15 caracteres.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="dni">DNI (no editable)</Label>
            <Input id="dni" value={user.dni || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 1122334455" />
             <p className="text-xs text-muted-foreground">
              Tu número para que te contacten por fichajes. No incluyas el 0 ni el 15.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email (no editable)</Label>
            <Input id="email" value={user.email || ''} disabled />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">
              Cancelar
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button type="button" onClick={handleSave}>
              Guardar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

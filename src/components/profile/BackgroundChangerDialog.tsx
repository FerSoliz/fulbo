
'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserProfile } from '@/lib/types';
import { CheckCircle2 } from 'lucide-react';
import React from 'react';

const backgrounds = [
  'https://i.postimg.cc/1RfWNTCC/lusail.png',
  'https://i.postimg.cc/BnnbJSjY/ELMONUMENTALRIVERPLATE2.png',
  'https://i.postimg.cc/fL20hVKv/LABOMBONERABOCAJUNIORS.jpg',
];

interface BackgroundChangerDialogProps {
  user: UserProfile;
  onSave: (updatedData: Partial<UserProfile>) => void;
  children: React.ReactNode;
}

export const BackgroundChangerDialog = ({ user, onSave, children }: BackgroundChangerDialogProps) => {
  const handleSelect = (url: string) => {
    onSave({ profileBackground: url });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cambiar Fondo de Perfil</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {backgrounds.map((bg) => (
            <div
              key={bg}
              className="relative aspect-video cursor-pointer group rounded-lg overflow-hidden"
              onClick={() => handleSelect(bg)}
            >
              <Image src={bg} alt="Fondo" layout="fill" objectFit="cover" />
              {user.profileBackground === bg && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
              )}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

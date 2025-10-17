'use client';

import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useUser } from '@/context/user-context';
import { useUpload } from '@/hooks/use-upload';
import { setHeaderBannerUrl } from '@/lib/firebase/db';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface EditBannerButtonProps {
  onUploadComplete: (newUrl: string) => void;
}

export function EditBannerButton({ onUploadComplete }: EditBannerButtonProps) {
  const { user } = useUser();
  const { uploadFile, isUploading } = useUpload(); // Corregido: de startUpload a uploadFile
  const { toast } = useToast();
  const [isHovering, setIsHovering] = useState(false);

  if (user?.role !== 'admin') {
    return null;
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Usamos la función correcta del hook: uploadFile
      const newUrl = await uploadFile(file, 'banners');
      if (newUrl) {
        // Guardamos la nueva URL en la base de datos
        await setHeaderBannerUrl(newUrl);
        // Notificamos al componente padre para que actualice la UI al instante
        onUploadComplete(newUrl);
        toast({ title: 'Éxito', description: 'El banner se ha actualizado correctamente.' });
      }
    } catch (error) {
      console.error("Error al subir el nuevo banner:", error);
      toast({ title: 'Error', description: 'No se pudo actualizar el banner.', variant: 'destructive' });
    }
  };

  return (
    <div 
      className="absolute top-2 right-2 z-10"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Button 
        variant={isHovering ? "secondary" : "ghost"} 
        size="icon"
        className="rounded-full h-8 w-8 transition-all"
        onClick={() => document.getElementById('banner-upload-input')?.click()}
        disabled={isUploading}
      >
        {isUploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Camera className="h-4 w-4" />
        )}
        <span className="sr-only">Cambiar banner</span>
      </Button>
      <input
        type="file"
        id="banner-upload-input"
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
      />
      {isHovering && !isUploading && (
        <div className="absolute top-full right-0 mt-1 bg-background border rounded-md px-2 py-1 text-xs shadow-lg">
          Cambiar banner
        </div>
      )}
    </div>
  );
}

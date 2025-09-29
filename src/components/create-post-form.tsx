'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Post, User } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast'; // Importamos useToast

interface CreatePostFormProps {
  currentUser: User | null;
  onAddPost: (newPostData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'media'>, imageFile?: File | null) => Promise<void>; // Aseguramos que onAddPost devuelve una promesa
}

export function CreatePostForm({ currentUser, onAddPost }: CreatePostFormProps) {
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast(); // Inicializamos useToast

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim() && !imageFile) {
      toast({
        title: "Error",
        description: "El post no puede estar vacío ni sin imagen.",
        variant: "destructive",
      });
      return;
    }
    if (!currentUser || currentUser.id === 'visitor') { // Aseguramos que el usuario esté realmente logueado
        toast({
            title: "Error",
            description: "Debes iniciar sesión para publicar.",
            variant: "destructive",
        });
        return;
    }

    setIsSubmitting(true);
    try {
        await onAddPost(
            {
                authorId: currentUser.id,
                content,
                isPinned,
            },
            imageFile
        );
        setContent('');
        setIsPinned(false);
        setImageFile(null);
        setImagePreview(null);
        toast({
            title: "Publicación exitosa",
            description: "Tu post ha sido publicado en el feed.",
        });
    } catch (error) {
        console.error("Error al intentar añadir post desde el formulario:", error);
        // Aquí mostramos el error al usuario usando el toast
        toast({
            title: "Error al publicar",
            description: "No se pudo publicar tu post. Asegúrate de tener los permisos necesarios o inténtalo de nuevo.",
            variant: "destructive",
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card p-4 rounded-lg shadow-sm">
      <div className="flex items-center space-x-3 mb-4">
        <Avatar>
          <AvatarImage src={currentUser?.avatar || 'https://github.com/shadcn.png'} alt="Avatar" />
          <AvatarFallback>CN</AvatarFallback>
        </Avatar>
        <p className="font-semibold text-card-foreground">{currentUser?.name || 'Usuario Invitado'}</p>
      </div>

      <Textarea
        placeholder="¿Qué estás pensando?"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="mb-4 bg-background border-border text-foreground"
        rows={4}
      />

      <div className="mb-4">
        <Label htmlFor="post-image" className="text-sm font-medium text-foreground">Adjuntar imagen (opcional)</Label>
        <input
          id="post-image"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        {imagePreview && (
          <div className="mt-4 relative w-full h-48 rounded-md overflow-hidden bg-muted flex items-center justify-center">
            <img src={imagePreview} alt="Previsualización de imagen" className="max-h-full max-w-full object-contain" />
            <Button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
              className="absolute top-2 right-2 p-2 rounded-full bg-background/70 hover:bg-background"
              size="icon"
            >
                X
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="pin-post"
            checked={isPinned}
            onCheckedChange={setIsPinned}
            className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
          />
          <Label htmlFor="pin-post" className="text-sm text-foreground">Fijar publicación (12 horas)</Label>
        </div>
        <Button type="submit" disabled={isSubmitting || (!content.trim() && !imageFile)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          {isSubmitting ? 'Publicando...' : 'Publicar'}
        </Button>
      </div>
    </form>
  );
}

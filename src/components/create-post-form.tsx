'use client';

// --- 1. Imports ---
// Se importan las herramientas necesarias de React, ShadCN, Zod y React Hook Form.
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Video, X, Play, Star } from 'lucide-react';
import { User, Post } from '@/lib/data';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useUpload } from '@/hooks/use-upload';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPostSchema, CreatePostInput } from '@/lib/validators'; // <= ¡Nuestro nuevo validador!

// --- 2. Props del Componente ---
interface CreatePostFormProps {
  currentUser: User;
  onAddPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => void;
}

// --- 3. Componente Principal ---
export function CreatePostForm({ currentUser, onAddPost }: CreatePostFormProps) {
  // Estado local para la UI que no forma parte del formulario (previsualizaciones, videos, etc.)
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [twitchChannelName, setTwitchChannelName] = useState<string | null>(null);
  
  // Hook para la subida de archivos y su estado de carga
  const { uploadMultipleFiles, isUploading, progress } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 4. Integración con React Hook Form y Zod ---
  // Aquí se inicializa el formulario.
  const form = useForm<CreatePostInput>({
    // Se le dice a react-hook-form que use nuestro schema de Zod para la validación.
    resolver: zodResolver(createPostSchema),
    // Valores por defecto del formulario.
    defaultValues: {
      content: "",
      files: [],
      isPinned: false,
    },
    // La validación se activa cuando el usuario interactúa con los campos.
    mode: "onChange",
  });
  
  // Observamos el valor del campo 'content' para detectar enlaces de video en tiempo real.
  const contentValue = form.watch('content');

  // --- 5. Lógica para detectar videos (YouTube/Twitch) ---
  useEffect(() => {
    const getYoutubeVideoId = (url: string): string | null => {
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
        const match = url.match(youtubeRegex);
        return match ? match[1] : null;
    };

    const getTwitchChannelName = (url: string): string | null => {
        const twitchRegex = /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)\/?$/;
        const match = url.match(twitchRegex);
        return match ? match[1] : null;
    };
    
    setYoutubeVideoId(getYoutubeVideoId(contentValue));
    setTwitchChannelName(getTwitchChannelName(contentValue));
  }, [contentValue]);
  
  const hasVideo = !!youtubeVideoId || !!twitchChannelName;
  
  // --- 6. Función de Envío del Formulario (onSubmit) ---
  // Esta función solo se ejecuta si la validación de Zod es exitosa.
  const onSubmit = async (data: CreatePostInput) => {
    let media: { type: 'image' | 'video'; url: string; videoType?: 'youtube' | 'twitch'; videoId?: string; }[] = [];
    
    // Subir imágenes si existen
    if(data.files && data.files.length > 0) {
      const uploadedImageUrls = await uploadMultipleFiles(data.files, `posts/${currentUser.id}`);
      media = uploadedImageUrls.map(url => ({ type: 'image', url }));
    } else if (youtubeVideoId) {
       media.push({ type: 'video', url: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`, videoType: 'youtube', videoId: youtubeVideoId });
    } else if (twitchChannelName) {
       media.push({ type: 'video', url: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${twitchChannelName}-1280x720.jpg`, videoType: 'twitch', videoId: twitchChannelName });
    }

    // Llamar a la función del componente padre para añadir el post
    onAddPost({
      authorId: currentUser.id,
      title: '', // El título ya no se usa
      content: data.content,
      media: media,
      isPinned: data.isPinned,
    });

    // Resetear el formulario y el estado local
    form.reset();
    setImagePreviews([]);
    setYoutubeVideoId(null);
    setTwitchChannelName(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  // --- 7. Renderizado del Componente (JSX) ---
  return (
    <Card className="p-4">
      {/* El componente Form de ShadCN envuelve todo y se conecta con react-hook-form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            {/* Campo de texto (Textarea) controlado por React Hook Form */}
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="w-full">
                  {/* Etiqueta para accesibilidad (oculta visualmente) */}
                  <FormLabel className="sr-only">Contenido del post</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`¿Qué estás pensando, ${currentUser.name}?`}
                      className="border-none shadow-none focus-visible:ring-0 px-0 resize-none overflow-hidden text-base bg-transparent min-h-[2.5rem] flex items-center"
                      rows={1}
                      disabled={isUploading}
                      {...field} // Conecta el textarea al estado del formulario
                    />
                  </FormControl>
                  {/* Aquí se mostrarán los mensajes de error para este campo si la validación falla */}
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Previsualización de Videos y Imágenes */}
          {hasVideo && (
            <div className="mt-4 relative group ml-14">
              <Image
                  src={youtubeVideoId ? `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg` : `https://static-cdn.jtvnw.net/previews-ttv/live_user_${twitchChannelName}-1280x720.jpg`}
                  alt="Video thumbnail"
                  width={1280}
                  height={720}
                  className="w-full h-auto rounded-lg object-cover bg-muted"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/1280x720/211536/9386b8?text=Stream+Offline'; }}
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                  <Play className="h-16 w-16 text-white" />
              </div>
            </div>
           )}

          {imagePreviews.length > 0 && !hasVideo && (
            <ScrollArea className="w-full whitespace-nowrap rounded-md mt-4 ml-14">
              <div className="flex space-x-2 p-1">
                  {imagePreviews.map((url, index) => (
                      <div key={index} className="relative h-24 w-24 flex-shrink-0">
                          <Image src={url} alt={`Preview ${index}`} fill className="object-cover rounded-md" />
                          {!isUploading && <Button
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-5 w-5 rounded-full"
                              onClick={() => {
                                const currentFiles = form.getValues('files') || [];
                                const updatedFiles = currentFiles.filter((_, i) => i !== index);
                                form.setValue('files', updatedFiles, { shouldValidate: true });

                                const updatedPreviews = imagePreviews.filter((_, i) => i !== index);
                                URL.revokeObjectURL(imagePreviews[index]); // Limpiar memoria
                                setImagePreviews(updatedPreviews);
                              }}
                          >
                              <X className="h-3 w-3" />
                          </Button>}
                      </div>
                  ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          )}
          
          {isUploading && <Progress value={progress} className="w-full" />}

          {/* Mensaje de error general para la validación a nivel de objeto (regla 'refine') */}
          {form.formState.errors.root && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
            {/* Campo para subir archivos */}
            <FormField
              control={form.control}
              name="files"
              render={({ field }) => (
                <FormItem>
                  <FormLabel 
                    htmlFor="file-upload"
                    className={cn(
                      "flex items-center gap-2 text-muted-foreground cursor-pointer",
                      (isUploading || hasVideo) && "opacity-50 cursor-not-allowed"
                    )}
                    aria-label="Añadir imagen"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </FormLabel>
                  <FormControl>
                    <input
                      id="file-upload"
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/*"
                      multiple
                      disabled={isUploading || hasVideo}
                      onChange={(e) => {
                        const newFiles = Array.from(e.target.files || []);
                        const currentFiles = field.value || [];
                        const combinedFiles = [...currentFiles, ...newFiles];
                        field.onChange(combinedFiles); // Actualiza el estado del formulario
                        
                        // Genera previsualizaciones
                        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
                        setImagePreviews(prev => [...prev, ...newPreviews]);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center gap-2">
              {/* Botón para fijar el post */}
              <FormField
                control={form.control}
                name="isPinned"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => field.onChange(!field.value)}
                        disabled={isUploading}
                        aria-label={field.value ? "Desfijar publicación" : "Fijar publicación"}
                      >
                        <Star className={cn("h-5 w-5 text-muted-foreground", field.value && "fill-accent text-accent")} />
                      </Button>
                    </FormControl>
                  </FormItem>
                )}
              />
              
              {/* Botón de envío */}
              <Button type="submit" disabled={!form.formState.isValid || isUploading}>
                {isUploading ? `Publicando... ${Math.round(progress)}%` : 'Publicar'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </Card>
  );
}

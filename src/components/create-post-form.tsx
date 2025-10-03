'use client';

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

interface CreatePostInput {
  content: string;
  files: File[];
  isPinned: boolean;
}

interface CreatePostFormProps {
  onAddPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => Promise<void>;
  currentUser: User;
}

const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})((?!\s).*)?$/;
const TWITCH_REGEX = /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)\/?((?!\s).*)?$/;

export function CreatePostForm({ currentUser, onAddPost }: CreatePostFormProps) {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [twitchChannelName, setTwitchChannelName] = useState<string | null>(null);
  
  const { uploadMultipleFiles, isUploading, progress } = useUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreatePostInput>({
    defaultValues: {
      content: "",
      files: [],
      isPinned: false,
    },
    mode: "onChange",
  });
  
  const contentValue = form.watch('content');
  const filesValue = form.watch('files');
  
  // Declaración de hasVideo movida aquí, ANTES de ser usada en useEffect
  const hasVideo = !!youtubeVideoId || !!twitchChannelName;

  useEffect(() => {
    if (hasVideo) return; 

    const youtubeMatch = contentValue.match(YOUTUBE_REGEX);
    if (youtubeMatch && youtubeMatch[1]) {
        setYoutubeVideoId(youtubeMatch[1]);
        form.setValue('content', contentValue.replace(YOUTUBE_REGEX, '').trim(), { shouldValidate: true });
        return;
    }

    const twitchMatch = contentValue.match(TWITCH_REGEX);
    if (twitchMatch && twitchMatch[1]) {
        setTwitchChannelName(twitchMatch[1]);
        form.setValue('content', contentValue.replace(TWITCH_REGEX, '').trim(), { shouldValidate: true });
        return;
    }

  }, [contentValue, form, hasVideo]); 
  
  const hasContent = !!contentValue.trim() || (filesValue && filesValue.length > 0) || hasVideo;
  
  const onSubmit = async (data: CreatePostInput) => {
    let media: { type: 'image' | 'video'; url: string; videoType?: 'youtube' | 'twitch'; videoId?: string; }[] = [];
    let externalUrl: string | null = null;

    if (youtubeVideoId) {
       media.push({ type: 'video', url: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`, videoType: 'youtube', videoId: youtubeVideoId });
       externalUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`;
    }
    
    if (twitchChannelName) {
       media.push({ type: 'video', url: `https://static-cdn.jtvnw.net/previews-ttv/live_user_${twitchChannelName}-1280x720.jpg`, videoType: 'twitch', videoId: twitchChannelName });
       externalUrl = `https://www.twitch.tv/${twitchChannelName}`;
    }
    
    if(data.files && data.files.length > 0) {
      if (hasVideo) {
        form.setError("root", { message: "No puedes añadir imágenes y un video en la misma publicación." });
        return;
      }
      const uploadedImageUrls = await uploadMultipleFiles(data.files, `posts/${currentUser.id}`);
      const imageMedia = uploadedImageUrls.map(url => ({ type: 'image' as const, url }));
      media.push(...imageMedia);
    }
    
    await onAddPost({
      authorId: currentUser.id,
      content: data.content || '',
      media: media,
      url: externalUrl,
      isPinned: data.isPinned,
    });

    form.reset();
    setImagePreviews([]);
    setYoutubeVideoId(null);
    setTwitchChannelName(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = () => {
      setYoutubeVideoId(null);
      setTwitchChannelName(null);
  };

  return (
    <Card className="p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel className="sr-only">Contenido del post</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={`¿Qué estás pensando, ${currentUser.name}?`}
                      className="border-none shadow-none focus-visible:ring-0 px-0 resize-none overflow-hidden text-base bg-transparent min-h-[2.5rem] flex items-center"
                      rows={1}
                      disabled={isUploading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
              {!isUploading && <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full z-10"
                  onClick={handleRemoveVideo}
                  aria-label="Eliminar video"
              >
                  <X className="h-4 w-4" />
              </Button>}
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
                                URL.revokeObjectURL(imagePreviews[index]);
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

          {form.formState.errors.root && (
            <p className="text-sm font-medium text-destructive">{form.formState.errors.root.message}</p>
          )}

          <div className="flex justify-between items-center pt-4 border-t">
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
                        field.onChange(combinedFiles); 
                        
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
              
              <Button type="submit" disabled={!hasContent || isUploading}>
                {isUploading ? `Publicando... ${Math.round(progress)}%` : 'Publicar'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </Card>
  );
}

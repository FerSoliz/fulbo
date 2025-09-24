'use client';

import { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Video, X, Play, Star } from 'lucide-react';
import { User, Post } from '@/lib/data';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useUpload } from '@/hooks/use-upload';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CreatePostFormProps {
  currentUser: User;
  onAddPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => void;
}

export function CreatePostForm({ currentUser, onAddPost }: CreatePostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMultipleFiles, isUploading, progress } = useUpload();

  const getYoutubeVideoId = (url: string): string | null => {
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
    const match = url.match(youtubeRegex);
    return match ? match[1] : null;
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Only set video if one isn't already set
    if (!youtubeVideoId) {
        const videoId = getYoutubeVideoId(newContent);
        if (videoId) {
            setYoutubeVideoId(videoId);
        }
    }
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFilesToUpload((prevFiles) => [...prevFiles, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prevPreviews => [...prevPreviews, ...newPreviews]);
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFilesToUpload(prevFiles => prevFiles.filter((_, i) => i !== indexToRemove));
    setImagePreviews(prevPreviews => {
      const newPreviews = prevPreviews.filter((_, i) => i !== indexToRemove);
      // Clean up blob urls to prevent memory leaks
      const urlToRemove = imagePreviews[indexToRemove];
      if (urlToRemove.startsWith('blob:')) {
          URL.revokeObjectURL(urlToRemove);
      }
      return newPreviews;
    });
  };

  const handleSubmit = async () => {
    let media: { type: 'image' | 'video'; url: string }[] = [];
    
    if (!title && !content && filesToUpload.length === 0 && !youtubeVideoId) return;
    
    if(filesToUpload.length > 0) {
      const uploadedImageUrls = await uploadMultipleFiles(filesToUpload, `posts/${currentUser.id}`);
      media = uploadedImageUrls.map(url => ({ type: 'image', url }));
    } else if (youtubeVideoId) {
       media.push({ type: 'video', url: `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg` });
    }

    onAddPost({
      authorId: currentUser.id,
      title,
      content,
      media: media,
      isPinned,
    });

    // Reset form
    setTitle('');
    setContent('');
    setFilesToUpload([]);
    setImagePreviews([]);
    setYoutubeVideoId(null);
    setIsPinned(false);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
          <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="w-full">
          <Input
            placeholder="Título de la publicación..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-bold border-none shadow-none focus-visible:ring-0 px-0"
            disabled={isUploading}
          />
          <Textarea
            placeholder={`¿Qué estás pensando, ${currentUser.name}? Pega un link de YouTube...`}
            value={content}
            onChange={handleContentChange}
            className="border-none shadow-none focus-visible:ring-0 px-0 resize-none"
            rows={2}
            disabled={isUploading}
          />
        </div>
      </div>
       
       {youtubeVideoId && (
        <div className="mt-4 relative group">
           <Image
                src={`https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`}
                alt="YouTube video thumbnail"
                width={1280}
                height={720}
                className="w-full h-auto rounded-lg object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                <Play className="h-16 w-16 text-white" />
            </div>
            {!isUploading && <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => setYoutubeVideoId(null)}
            >
                <X className="h-4 w-4" />
            </Button>}
        </div>
       )}

      {imagePreviews.length > 0 && !youtubeVideoId && (
        <ScrollArea className="w-full whitespace-nowrap rounded-md mt-4">
            <div className="flex space-x-2 p-1">
                {imagePreviews.map((url, index) => (
                    <div key={index} className="relative h-24 w-24 flex-shrink-0">
                        <Image src={url} alt={`Preview ${index}`} fill className="object-cover rounded-md" />
                        {!isUploading && <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5 rounded-full"
                            onClick={() => removeImage(index)}
                        >
                            <X className="h-3 w-3" />
                        </Button>}
                    </div>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      {isUploading && <Progress value={progress} className="mt-4" />}

      <div className="flex justify-between items-center mt-4 pt-4 border-t">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || !!youtubeVideoId}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Foto
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={!!youtubeVideoId}
          />
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setIsPinned(!isPinned)} disabled={isUploading}>
                <Star className={cn("h-5 w-5 text-muted-foreground", isPinned && "fill-accent text-accent")} />
            </Button>
            <Button onClick={handleSubmit} disabled={(!title && !content && filesToUpload.length === 0 && !youtubeVideoId) || isUploading}>
              {isUploading ? `Publicando... ${Math.round(progress)}%` : 'Publicar'}
            </Button>
        </div>
      </div>
    </Card>
  );
}

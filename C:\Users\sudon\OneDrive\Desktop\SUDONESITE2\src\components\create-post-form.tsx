'use client';

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Video, X } from 'lucide-react';
import { User, Post } from '@/lib/data';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Image from 'next/image';
import { useUpload } from '@/hooks/use-upload';
import { Progress } from '@/components/ui/progress';

interface CreatePostFormProps {
  currentUser: User;
  onAddPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => void;
}

export function CreatePostForm({ currentUser, onAddPost }: CreatePostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadMultipleFiles, isUploading, progress } = useUpload();

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
      newPreviews.forEach(p => { if (p.startsWith('blob:')) URL.revokeObjectURL(p) }); // Clean up blob urls
      return newPreviews.filter((_, i) => i !== indexToRemove);
    });
  };

  const handleSubmit = async () => {
    if ((!title && !content) || filesToUpload.length === 0) return;
    
    let uploadedImageUrls: string[] = [];
    if(filesToUpload.length > 0) {
      uploadedImageUrls = await uploadMultipleFiles(filesToUpload, `posts/${currentUser.id}`);
    }

    onAddPost({
      authorId: currentUser.id,
      title,
      content,
      media: uploadedImageUrls.map(url => ({ type: 'image', url })),
    });

    // Reset form
    setTitle('');
    setContent('');
    setFilesToUpload([]);
    setImagePreviews([]);
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
            placeholder={`¿Qué estás pensando, ${currentUser.name}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 px-0 resize-none"
            rows={2}
            disabled={isUploading}
          />
        </div>
      </div>
      {imagePreviews.length > 0 && (
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
            disabled={isUploading}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Foto/Video
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
        </div>
        <Button onClick={handleSubmit} disabled={(!title && !content && filesToUpload.length === 0) || isUploading}>
          {isUploading ? 'Publicando...' : 'Publicar'}
        </Button>
      </div>
    </Card>
  );
}

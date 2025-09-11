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

interface CreatePostFormProps {
  currentUser: User;
  onAddPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => void;
}

export function CreatePostForm({ currentUser, onAddPost }: CreatePostFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newImageUrls = files.map((file) => URL.createObjectURL(file));
      setImages((prevImages) => [...prevImages, ...newImageUrls]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (title || content || images.length > 0) {
      onAddPost({
        authorId: currentUser.id,
        title,
        content,
        media: images.map(url => ({ type: 'image', url })),
      });
      setTitle('');
      setContent('');
      setImages([]);
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
          />
          <Textarea
            placeholder={`¿Qué estás pensando, ${currentUser.name}?`}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0 px-0 resize-none"
            rows={2}
          />
        </div>
      </div>
      {images.length > 0 && (
        <ScrollArea className="w-full whitespace-nowrap rounded-md mt-4">
            <div className="flex space-x-2 p-1">
                {images.map((url, index) => (
                    <div key={index} className="relative h-24 w-24 flex-shrink-0">
                        <Image src={url} alt={`Preview ${index}`} layout="fill" className="object-cover rounded-md" />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5 rounded-full"
                            onClick={() => removeImage(index)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                ))}
            </div>
            <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}
      <div className="flex justify-between items-center mt-4 pt-4 border-t">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            Foto/Video
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*,video/*"
            multiple
            onChange={handleImageUpload}
          />
        </div>
        <Button onClick={handleSubmit} disabled={!title && !content && images.length === 0}>
          Publicar
        </Button>
      </div>
    </Card>
  );
}

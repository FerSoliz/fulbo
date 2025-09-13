
'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Heart, MessageSquare, Bookmark, MoreHorizontal, Play, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Post, User, Comment } from '@/lib/data';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onUpdatePost: (post: Post) => void;
  onDeletePost: (postId: number) => void;
  allUsers: User[];
}

export function PostCard({ post, currentUser, onUpdatePost, onDeletePost, allUsers }: PostCardProps) {
  const author = allUsers.find(u => u.id === post.authorId);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  if (!author) return null;

  const handleLike = () => {
    if (!currentUser || currentUser.name === 'VISITANTE') return;
    const isLiked = post.likes.includes(currentUser.id);
    const newLikes = isLiked
      ? post.likes.filter(id => id !== currentUser.id)
      : [...post.likes, currentUser.id];
    onUpdatePost({ ...post, likes: newLikes });
  };

  const handleAddComment = () => {
    if (!currentUser || currentUser.name === 'VISITANTE' || !commentText.trim()) return;
    const newComment: Comment = {
      id: Date.now(),
      authorId: currentUser.id,
      content: commentText,
      createdAt: new Date().toISOString(),
    };
    onUpdatePost({ ...post, comments: [...post.comments, newComment] });
    setCommentText('');
    setShowComments(true); // Ensure comments are visible after adding a new one
  };

  const isLiked = currentUser && post.likes.includes(currentUser.id);
  const canEditOrDelete = currentUser?.id === post.authorId || currentUser?.role === 'admin' || currentUser?.role === 'editor';
  const isVisitor = currentUser?.name === 'VISITANTE';

  const renderMedia = () => {
    const { media } = post;
    if (!media || media.length === 0) return null;

    if (media[0].url.includes('img.youtube.com')) {
        return (
             <Dialog>
                <DialogTrigger asChild>
                    <div className="relative cursor-pointer group">
                        <Image src={media[0].url} alt="Video thumbnail" width={1280} height={720} className="w-full h-auto rounded-lg object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                            <Play className="h-16 w-16 text-white group-hover:scale-110 transition-transform" />
                        </div>
                    </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0">
                    <div className="aspect-video">
                        <iframe
                            src={`https://www.youtube.com/embed/${media[0].url.split('/vi/')[1].split('/')[0]}`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full"
                        ></iframe>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    const imageCount = media.length;
    const gridClasses = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-2 grid-rows-2',
      4: 'grid-cols-2 grid-rows-2',
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                 <div className={`grid ${gridClasses[Math.min(imageCount, 4) as keyof typeof gridClasses] || 'grid-cols-2'} gap-1 max-h-[500px] overflow-hidden rounded-lg cursor-pointer`}>
                    {media.slice(0, 4).map((item, index) => (
                        <div key={index} className={cn("relative", imageCount === 3 && index === 0 && "row-span-2")}>
                            <Image src={item.url} alt={`Post media ${index + 1}`} layout="fill" className="object-cover" />
                            {index === 3 && imageCount > 4 && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-3xl font-bold">
                                    +{imageCount - 4}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] p-2">
                 <Carousel className="w-full h-full">
                    <CarouselContent className="h-full">
                        {media.map((item, index) => (
                            <CarouselItem key={index} className="flex items-center justify-center h-full">
                                <Image src={item.url} alt={`Post media ${index + 1}`} width={1920} height={1080} className="max-h-full w-auto object-contain" />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                </Carousel>
            </DialogContent>
        </Dialog>
    )
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Link href={`/profile/${author.id}`}>
          <Avatar>
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${author.id}`} className="hover:underline">
            <div className="flex items-center gap-1">
                <p className="font-semibold text-sm">{author.name}</p>
                 {(author.role === 'admin' || author.role === 'editor') && (
                    <Image src="https://i.postimg.cc/SQM9LfMY/verificado.png" alt="Editor" width={16} height={16} />
                )}
            </div>
          </Link>
          <p className="text-xs text-muted-foreground">{author.location} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}</p>
        </div>
        {canEditOrDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDeletePost(post.id)} className="text-destructive">
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <h2 className="text-xl font-bold mb-2">{post.title}</h2>
        <p className="text-sm whitespace-pre-wrap mb-4">{post.content}</p>
        {renderMedia()}
      </CardContent>
      <CardFooter className="flex-col items-start">
        <div className="flex justify-between w-full pb-2 border-b">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleLike} disabled={isVisitor}>
                <Heart className={cn("h-5 w-5", isLiked && 'text-red-500 fill-current')} />
                <span className="ml-2 text-sm">{post.likes.length}</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}>
                <MessageSquare className="h-5 w-5" />
                <span className="ml-2 text-sm">{post.comments.length}</span>
              </Button>
            </div>
            <Button variant="ghost" size="sm" disabled={isVisitor}>
                <Bookmark className="h-5 w-5" />
            </Button>
        </div>
        {showComments && (
            <div className="w-full space-y-4 pt-4">
            {post.comments.map(comment => {
                const commentAuthor = allUsers.find(u => u.id === comment.authorId);
                return commentAuthor ? (
                <div key={comment.id} className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={commentAuthor.avatar} />
                        <AvatarFallback>{commentAuthor.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="bg-muted p-3 rounded-lg w-full">
                        <div className="flex items-center gap-2">
                             <Link href={`/profile/${commentAuthor.id}`} className="hover:underline">
                                <span className="font-semibold text-sm">{commentAuthor.name}</span>
                             </Link>
                            {(commentAuthor.role === 'admin' || commentAuthor.role === 'editor') && (
                                <Image src="https://i.postimg.cc/SQM9LfMY/verificado.png" alt="Editor" width={14} height={14} />
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                </div>
                ) : null;
            })}
            </div>
        )}
        {currentUser && !isVisitor && (
            <div className="flex w-full items-center gap-2 pt-4">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUser.avatar} />
                    <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <Input 
                    placeholder="Escribe un comentario..."
                    className="h-9"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>Publicar</Button>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}

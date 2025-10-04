'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Heart, MessageSquare, Bookmark, MoreHorizontal, Play, Pencil, Star, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Post, User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onLikeToggle: (postId: string, currentLikesMap: Record<string, { name: string; avatar: string; username: string; }>) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onDeletePost: (postId: string) => void;
}

export function PostCard({ post, currentUser, onLikeToggle, onAddComment, onDeletePost }: PostCardProps) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [isYoutubePlaying, setIsYoutubePlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const authorName = post.authorName || 'Usuario Desconocido';
  const authorAvatar = post.authorAvatar || 'https://avatar.vercel.sh/unknown.png';

  const handleLike = () => {
    if (!currentUser || currentUser.id === 'visitor') return;
    onLikeToggle(post.id, post.likes || {});
  };

  const handleAddComment = () => {
    if (!currentUser || currentUser.id === 'visitor' || !commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
    setShowComments(true);
  };
  
  const isPinned = post.isPinned && post.pinnedUntil && new Date(post.pinnedUntil) > new Date();
  const isLiked = currentUser && post.likes ? !!post.likes[currentUser.id] : false;
  const canDelete = currentUser?.id === post.authorId || currentUser?.role === 'admin';
  const isVisitor = !currentUser || currentUser.id === 'visitor';

  const renderHeader = () => {
    if (!post.authorName) {
      return (
        <CardHeader className="flex flex-row items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </CardHeader>
      );
    }

    return (
      <CardHeader className="flex flex-row items-center gap-4">
        <Link href={`/profile/${post.authorId}`}>
          <Avatar>
            <AvatarImage src={authorAvatar} alt={authorName} />
            <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1">
          <Link href={`/profile/${post.authorId}`} className="hover:underline">
            <p className="font-semibold text-sm">{authorName}</p>
          </Link>
          <p className="text-xs text-muted-foreground">
            {post.location || ''} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}
          </p>
        </div>
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onDeletePost(post.id)} className="text-destructive">Eliminar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
    );
  };

  const renderMedia = () => {
    const { media } = post;
    if (!media || media.length === 0) return null;

    const videoItem = media.find(item => item.type === 'video');
    if (videoItem) {
      const isTwitch = videoItem.videoType === 'twitch' && videoItem.videoId;
      const isYoutube = videoItem.videoType === 'youtube' && videoItem.videoId;
      
      const twitchUrl = `https://www.twitch.tv/${videoItem.videoId}`;
      const youtubeUrl = `https://www.youtube.com/embed/${videoItem.videoId}?autoplay=1&modestbranding=1&rel=0`;

      if (isYoutube) {
        return (
          <div className="relative aspect-video bg-black overflow-hidden">
            {!isYoutubePlaying && (
              <div 
                className="absolute inset-0 cursor-pointer group"
                onClick={() => setIsYoutubePlaying(true)}
                role="button"
                aria-label="Reproducir video de YouTube"
              >
                <Image 
                  src={videoItem.url} 
                  alt="Miniatura del video de YouTube" 
                  fill 
                  className="object-cover transition-opacity duration-300 group-hover:opacity-80"
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/1280x720/211536/9386b8?text=Video+No+Disponible'; }}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Play className="h-16 w-16 text-white transform transition-transform duration-300 group-hover:scale-110" />
                </div>
              </div>
            )}
            
            {isYoutubePlaying && (
              <>
                {!isPlayerReady && (
                   <div className="absolute inset-0 flex items-center justify-center" aria-live="polite" aria-busy="true">
                     <Loader2 className="h-12 w-12 text-white animate-spin" />
                   </div>
                )}
                <iframe
                  src={youtubeUrl}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className={cn(
                    "w-full h-full transition-opacity duration-500",
                    isPlayerReady ? "opacity-100" : "opacity-0"
                  )}
                  onLoad={() => setIsPlayerReady(true)}
                ></iframe>
              </>
            )}
          </div>
        );
      }

      if (isTwitch) {
        return (
            <Link href={twitchUrl} target="_blank" rel="noopener noreferrer" aria-label={`Ver en directo a ${videoItem.videoId} en Twitch`}>
                <div className="relative cursor-pointer group aspect-video bg-muted overflow-hidden">
                    <Image src={videoItem.url} alt="Miniatura del stream de Twitch" fill className="object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/1280x720/211536/9386b8?text=Stream+Offline'; }}/>
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-16 w-16 text-white group-hover:scale-110 transition-transform" /></div>
                </div>
            </Link>
        );
      }
    }

    const imageMedia = media.filter(item => item.type === 'image');
    if (imageMedia.length === 0) return null;

    const imageCount = imageMedia.length;

    const gridClasses = {
      1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-2 grid-rows-2', 4: 'grid-cols-2 grid-rows-2',
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                 <div className={`grid ${gridClasses[Math.min(imageCount, 4) as keyof typeof gridClasses]} gap-1 overflow-hidden cursor-pointer`}>
                    {imageMedia.slice(0, 4).map((item, index) => (
                        <div key={item.url || index} className={cn("relative bg-muted", imageCount === 3 && index === 0 && "row-span-2", imageCount === 1 ? "aspect-video" : "aspect-square")}>
                            <Image src={item.url} alt={`Post media ${index + 1}`} fill className="object-contain" />
                            {index === 3 && imageCount > 4 && (<div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-3xl font-bold">+{imageCount - 4}</div>)}
                        </div>
                    ))}
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] p-2">
                 {/* FIX: Añadido DialogHeader con título y descripción para accesibilidad */}
                 <DialogHeader className="sr-only"> {/* sr-only es para ocultarlo visualmente pero mantenerlo para lectores de pantalla */}
                    <DialogTitle>Galería de imágenes</DialogTitle>
                    <DialogDescription>Navega por las imágenes de la publicación usando las flechas de navegación.</DialogDescription>
                 </DialogHeader>
                 <Carousel className="w-full h-full">
                    <CarouselContent className="h-full">
                        {imageMedia.map((item, index) => (<CarouselItem key={item.url || index} className="flex items-center justify-center h-full"><Image src={item.url} alt={`Post media ${index + 1}`} width={1920} height={1080} className="max-h-full w-auto object-contain" /></CarouselItem>))}
                    </CarouselContent>
                    <CarouselPrevious /><CarouselNext />
                </Carousel>
            </DialogContent>
        </Dialog>
    );
  };

  return (
    <Card className="relative overflow-hidden">
        {isPinned && <div className="absolute top-3 right-3 z-10 text-accent"><Star className="h-5 w-5 fill-current"/></div>}
        
        {renderHeader()}
        
        <CardContent className="p-0">
            {post.content && <p className="px-6 pb-4 text-sm whitespace-pre-wrap">{post.content}</p>}
            {renderMedia()}
        </CardContent>

        <CardFooter className="flex-col items-start">
             <div className="flex justify-between w-full pb-2 border-b">
                <div className="flex items-center gap-4">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={handleLike} disabled={isVisitor}><Heart className={cn("h-5 w-5", isLiked && 'text-red-500 fill-current')} /></Button>
                        {post.likes && Object.keys(post.likes).length > 0 ? (
                            <Dialog>
                                <DialogTrigger asChild><span className="text-sm font-medium text-muted-foreground cursor-pointer hover:underline">{Object.keys(post.likes).length} {Object.keys(post.likes).length === 1 ? 'Me gusta' : 'Me gusta'}</span></DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    {/* FIX: Añadido DialogDescription para accesibilidad */}
                                    <DialogHeader>
                                        <DialogTitle>Le gusta a</DialogTitle>
                                        <DialogDescription>Esta es la lista de usuarios a los que les gusta esta publicación.</DialogDescription>
                                    </DialogHeader>
                                    <div className="flex flex-col gap-4 py-4 max-h-[400px] overflow-y-auto">
                                        {Object.entries(post.likes).map(([userId, likeUser]) => (
                                            <div key={userId} className="flex items-center gap-4"><Link href={`/profile/${userId}`}><Avatar><AvatarImage src={likeUser.avatar} alt={likeUser.name} /><AvatarFallback>{likeUser.name.charAt(0)}</AvatarFallback></Avatar></Link><Link href={`/profile/${userId}`} className="font-semibold hover:underline">{likeUser.name}</Link></div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        ) : <span className="text-sm font-medium text-muted-foreground">0 Me gusta</span>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}><MessageSquare className="h-5 w-5" /><span className="ml-2 text-sm">{post.comments ? Object.keys(post.comments).length : 0}</span></Button>
                </div>
                <Button variant="ghost" size="sm" disabled={isVisitor}><Bookmark className="h-5 w-5" /></Button>
            </div>

            {showComments && (
                <div className="w-full space-y-4 pt-4">
                    {post.comments && Object.entries(post.comments).map(([commentId, comment]) => (
                        <div key={commentId} className="flex items-start gap-3">
                            <Avatar className="h-8 w-8"><AvatarImage src={comment.authorAvatar} /><AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback></Avatar>
                            <div className="bg-muted p-3 rounded-lg w-full">
                                <Link href={`/profile/${comment.authorId}`} className="hover:underline">
                                    <span className="font-semibold text-sm">{comment.authorName}</span>
                                </Link>
                                <p className="text-sm text-muted-foreground">{comment.content}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {!isVisitor && (
                <div className="flex w-full items-center gap-2 pt-4">
                    <Avatar className="h-8 w-8"><AvatarImage src={currentUser?.avatar} /><AvatarFallback>{currentUser?.name ? currentUser.name.charAt(0) : ''}</AvatarFallback></Avatar>
                    <Input placeholder="Escribe un comentario..." className="h-9" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}/>
                    <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>Publicar</Button>
                </div>
            )}
        </CardFooter>
    </Card>
  );
}
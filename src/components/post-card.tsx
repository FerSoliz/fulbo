'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tooltip, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Heart, MessageSquare, MoreHorizontal, Play, Star, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Post, User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  onLikeToggle: (postId: string) => void;
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
  const isVisitor = !currentUser || currentUser.id === 'visitor';

  const handleLike = () => {
    if (isVisitor) return;
    onLikeToggle(post.id);
  };

  const handleAddComment = () => {
    if (isVisitor || !commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
    setShowComments(true);
  };
  
  const isPinned = post.isPinned && post.pinnedUntil && new Date(post.pinnedUntil) > new Date();
  const canDelete = currentUser?.id === post.authorId || currentUser?.role === 'admin';

  const { media, content } = post;
  const hasMedia = media && media.length > 0;
  const hasContent = content && content.trim() !== '';
  const videoItem = media?.find(item => item.type === 'video');
  const imageMedia = media?.filter(item => item.type === 'image') || [];
  const isTwitch = videoItem?.videoType === 'twitch' && videoItem?.videoId;
  const isYoutube = videoItem?.videoType === 'youtube' && videoItem?.videoId;
  const twitchUrl = `https://www.twitch.tv/${videoItem?.videoId}`;
  const youtubeUrl = `https://www.youtube.com/embed/${videoItem?.videoId}?autoplay=1&modestbranding=1&rel=0`;
  const imageCount = imageMedia.length;
  const gridClasses = {
    1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-2 grid-rows-2', 4: 'grid-cols-2 grid-rows-2',
  };

  const ActionButtons = ({ isOverlay }: { isOverlay: boolean }) => {
    const isLiked = currentUser && post.likes ? !!post.likes[currentUser.id] : false;
    const baseTextColor = isOverlay ? 'text-white' : 'text-primary';
    const mutedTextColor = isOverlay ? 'text-gray-300' : 'text-muted-foreground';

    return (
      <div className={cn("flex items-center gap-4 w-full", isOverlay ? "px-4 pb-3" : "px-4")}>
        <Button variant="ghost" size="icon" onClick={handleLike} disabled={isVisitor} className={cn("hover:bg-transparent", isOverlay && "hover:text-white/80")}>
          <Heart className={cn("h-5 w-5", isLiked ? 'text-red-500 fill-current' : baseTextColor)} />
          <span className="sr-only">Like</span>
        </Button>
        {post.likes && Object.keys(post.likes).length > 0 ? (
          <Dialog>
            <DialogTrigger asChild>
              <span className={cn("text-sm font-medium cursor-pointer hover:underline", baseTextColor)}>
                {Object.keys(post.likes).length} {Object.keys(post.likes).length === 1 ? 'Me gusta' : 'Me gusta'}
              </span>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader><DialogTitle>Le gusta a</DialogTitle></DialogHeader>
              <div className="flex flex-col gap-4 py-4 max-h-[400px] overflow-y-auto">
                {Object.entries(post.likes).map(([userId, likeUser]) => (
                  <div key={userId} className="flex items-center gap-4">
                    <Link href={`/profile/${userId}`} legacyBehavior>
                      <Avatar><AvatarImage src={likeUser.avatar} alt={likeUser.name} /><AvatarFallback>{likeUser.name.charAt(0)}</AvatarFallback></Avatar>
                    </Link>
                    <Link href={`/profile/${userId}`} className="font-semibold hover:underline" legacyBehavior>{likeUser.name}</Link>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        ) : <span className={cn("text-sm font-medium", mutedTextColor)}>0 Me gusta</span>}
        <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)} className={cn("ml-auto", baseTextColor, isOverlay && "hover:text-white/80")}>
          <MessageSquare className="h-5 w-5" />
          <span className="ml-2 text-sm">{post.comments ? Object.keys(post.comments).length : 0}</span>
        </Button>
      </div>
    );
  };

  if (!post.authorName) {
    return (
      <div className="relative mt-6">
        <div className="absolute top-0 left-4 z-10 transform -translate-y-1/2">
          <Skeleton className="w-12 h-12 rounded-full border-4 border-background" />
        </div>
        <Card>
          <div className="h-6" />
          <Skeleton className="h-[250px] w-full" />
          <div className="p-4"><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" /></div>
        </Card>
      </div>
    );
  }
  
  const MediaContent = () => (
    <div className={cn("relative border-t border-accent", hasContent && "border-b border-accent")}>
      {isPinned && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild><div className="absolute top-2 left-2 z-20 text-accent cursor-pointer"><Star className="h-5 w-5 fill-current"/></div></TooltipTrigger>
            <TooltipContent><p>Publicación Fijada</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {canDelete && (
        <div className="absolute top-2 right-2 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/30 hover:bg-black/50 text-white"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent><DropdownMenuItem onClick={() => onDeletePost(post.id)} className="text-destructive">Eliminar</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {isYoutube ? (
        <div className="aspect-video bg-black overflow-hidden">
          {!isYoutubePlaying && (
            <div className="absolute inset-0 cursor-pointer group" onClick={() => setIsYoutubePlaying(true)} role="button" aria-label="Reproducir video de YouTube">
              <Image src={videoItem.url} alt="Miniatura del video de YouTube" fill className="object-cover transition-opacity duration-300 group-hover:opacity-80" onError={(e) => { e.currentTarget.src = 'https://placehold.co/1280x720/211536/9386b8?text=Video+No+Disponible'; }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"/>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-16 w-16 text-white transform transition-transform duration-300 group-hover:scale-110" /></div>
            </div>
          )}
          {isYoutubePlaying && (
            <>
              {!isPlayerReady && <div className="absolute inset-0 flex items-center justify-center" aria-live="polite" aria-busy="true"><Loader2 className="h-12 w-12 text-white animate-spin" /></div>}
              <iframe src={youtubeUrl} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className={cn("w-full h-full transition-opacity duration-500 z-10", isPlayerReady ? "opacity-100" : "opacity-0")} onLoad={() => setIsPlayerReady(true)}></iframe>
            </>
          )}
        </div>
      ) : isTwitch ? (
        <Link href={twitchUrl} target="_blank" rel="noopener noreferrer" aria-label={`Ver en directo a ${videoItem.videoId} en Twitch`} legacyBehavior>
          <div className="aspect-video bg-muted overflow-hidden">
            <Image src={videoItem.url} alt="Miniatura del stream de Twitch" fill className="object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/1280x720/211536/9386b8?text=Stream+Offline'; }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-16 w-16 text-white group-hover:scale-110 transition-transform" /></div>
          </div>
        </Link>
      ) : imageMedia.length > 0 && (
        <Dialog>
          <DialogTrigger asChild>
             <div className={`grid ${gridClasses[Math.min(imageCount, 4) as keyof typeof gridClasses]} gap-1 overflow-hidden cursor-pointer`}>
              {imageMedia.slice(0, 4).map((item, index) => (
                <div key={item.url || index} className={cn("relative bg-muted w-full", imageCount === 3 && index === 0 && "row-span-2", imageCount > 1 && "aspect-square")}>
                  {imageCount === 1 ? <Image src={item.url} alt={`Post media ${index + 1}`} width={1000} height={1000} className="w-full h-auto object-contain" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" /> : <Image src={item.url} alt={`Post media ${index + 1}`} fill className="object-contain" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />}
                  {index === 3 && imageCount > 4 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-3xl font-bold">+{imageCount - 4}</div>}
                </div>
              ))}
            </div>
          </DialogTrigger>
           <DialogContent className="p-0 border-none bg-transparent shadow-none w-auto max-w-none">
            <Carousel className="w-full max-w-4xl mx-auto">
              <CarouselContent>
                {imageMedia.map((item, index) => (
                  <CarouselItem key={item.url || index}>
                    <Image src={item.url} alt={`Post media ${index + 1}`} width={1920} height={1080} className="object-contain w-full h-full" />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
              <DialogClose className="absolute top-2 right-2 z-50 p-2 rounded-full bg-black/50 text-white"><X className="h-6 w-6"/></DialogClose>
            </Carousel>
          </DialogContent>
        </Dialog>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 z-20"><ActionButtons isOverlay={true} /></div>
    </div>
  );

  return (
    <div className="relative mt-6">
        <div className="absolute top-0 left-0 right-0 w-full z-10 px-4 flex justify-between items-start pointer-events-none">
            <div className="flex items-start gap-3 pointer-events-auto">
                <div className="transform -translate-y-1/2">
                    <Link href={`/profile/${post.authorId}`} passHref>
                    <Avatar className="w-12 h-12 border-4 border-background">
                        <AvatarImage src={authorAvatar} alt={authorName} />
                        <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    </Link>
                </div>
                <div className="transform -translate-y-full">
                    <p className="text-sm pt-1">
                    <Link href={`/profile/${post.authorId}`} className="hover:underline font-semibold text-foreground mr-2">
                        {authorName}
                    </Link>
                    {post.location && <span className="text-slate-500 text-xs align-middle">· {post.location}</span>}
                    </p>
                </div>
            </div>
            <div className="transform -translate-y-full pointer-events-auto">
                <p className="text-xs text-slate-500 text-right pt-1">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}
                </p>
            </div>
        </div>
      <Card className="relative">
        <CardContent className="p-0 border-b border-b-[#2490e3]">
          {hasMedia && <MediaContent />}
          {hasContent && <p className="px-6 py-4 text-sm whitespace-pre-wrap">{content}</p>}
        </CardContent>
        
        <CardFooter className="flex-col items-start pt-2">
          {!hasMedia && <ActionButtons isOverlay={false} />}
          {showComments && (
            <div className="w-full space-y-4 pt-4 mt-4 border-t px-4">
              {post.comments && Object.entries(post.comments).map(([commentId, comment]) => (
                <div key={commentId} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8"><AvatarImage src={comment.authorAvatar} /><AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback></Avatar>
                  <div className="bg-muted p-3 rounded-lg w-full">
                    <div className="flex items-center justify-between">
                      <Link href={`/profile/${comment.authorId}`} className="hover:underline" legacyBehavior><span className="font-semibold text-sm">{comment.authorName}</span></Link>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!isVisitor && (
            <div className="flex w-full items-center gap-2 pt-4 mt-4 border-t px-4">
              <Avatar className="h-8 w-8"><AvatarImage src={currentUser?.avatar} /><AvatarFallback>{currentUser?.name ? currentUser.name.charAt(0) : ''}</AvatarFallback></Avatar>
              <Input placeholder="Escribe un comentario..." className="h-9" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}/>
              <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>Publicar</Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

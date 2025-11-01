'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Heart, MessageSquare, MoreHorizontal, Play, Star, Loader2, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Post, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Helper constants
const COMMENT_CHAR_LIMIT = 200;
const COMMENT_TRUNCATE_LENGTH = 80;

// =================================================================================================
// 1. Componente de Contenido Multimedia Extraído
// =================================================================================================
// Se extrajo MediaContent para evitar que su estado (y el del DropdownMenu) se reinicie
// cada vez que el componente padre PostCard se re-renderiza.
// =================================================================================================

interface MediaContentProps {
  post: Post;
  canDelete: boolean;
  isPinned: boolean;
  isPriority: boolean;
  isVisitor: boolean;
  isLiked: boolean;
  onDeletePost: (postId: string) => void;
  onLikeToggle: () => void;
  onToggleComments: () => void;
}

function MediaContent({
  post,
  canDelete,
  isPinned,
  isPriority,
  isVisitor,
  isLiked,
  onDeletePost,
  onLikeToggle,
  onToggleComments,
}: MediaContentProps) {
  const [isYoutubePlaying, setIsYoutubePlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const { media } = post;
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

  return (
    <div className="relative border-y-4 border-accent-red">
      {isPinned && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild><div className="absolute top-2 left-2 z-20 text-accent-red cursor-pointer"><Star className="h-5 w-5 fill-current"/></div></TooltipTrigger>
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
        <div className="aspect-square bg-black overflow-hidden">
          {!isYoutubePlaying && (
            <div className="absolute inset-0 cursor-pointer group" onClick={() => setIsYoutubePlaying(true)} role="button" aria-label="Reproducir video de YouTube">
              <Image src={videoItem.url} alt="Miniatura del video de YouTube" fill className="object-cover transition-opacity duration-300 group-hover:opacity-80" onError={(e) => { e.currentTarget.src = 'https://placehold.co/1280x720/211536/9386b8?text=Video+No+Disponible'; }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={isPriority} />
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
        <Link
          href={twitchUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Ver en directo a ${videoItem.videoId} en Twitch`}>
          <div className="aspect-square bg-muted overflow-hidden">
            <Image src={videoItem.url} alt="Miniatura del stream de Twitch" fill className="object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/1280x720/211536/9386b8?text=Stream+Offline'; }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" priority={isPriority} />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-16 w-16 text-white group-hover:scale-110 transition-transform" /></div>
          </div>
        </Link>
      ) : imageMedia.length > 0 && (
        <Dialog>
            <DialogTrigger asChild>
                {imageCount === 1 ? (
                    <div className="relative cursor-pointer">
                        <Image
                            src={imageMedia[0].url}
                            alt={`Post media 1`}
                            width={1000} 
                            height={1000}
                            className="w-full h-auto"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={isPriority}
                        />
                    </div>
                ) : (
                    <div className={`grid ${gridClasses[Math.min(imageCount, 4) as keyof typeof gridClasses]} gap-1 overflow-hidden cursor-pointer aspect-square bg-muted`}>
                        {imageMedia.slice(0, 4).map((item, index) => (
                            <div key={item.url || index} className={cn("relative bg-muted w-full h-full", imageCount === 3 && index === 0 && "row-span-2 col-span-1", imageCount >= 3 && index > 0 && "col-span-1")}>
                                <Image 
                                    src={item.url} 
                                    alt={`Post media ${index + 1}`} 
                                    fill 
                                    className="object-cover" 
                                    sizes="(max-width: 768px) 50vw, 33vw" 
                                    priority={isPriority && index === 0}
                                />
                                {index === 3 && imageCount > 4 && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-3xl font-bold">+{imageCount - 4}</div>}
                            </div>
                        ))}
                    </div>
                )}
          </DialogTrigger>
          <DialogContent className="p-0 bg-transparent border-none max-w-7xl w-screen h-screen flex items-center justify-center">
            <Carousel className="w-full max-w-4xl">
              <CarouselContent>
                {imageMedia.map((item, index) => (
                  <CarouselItem key={item.url || index} className="relative h-[90vh]">
                     <Image
                        src={item.url}
                        alt={`Post media ${index + 1}`}
                        fill
                        className="object-contain"
                        sizes="100vw"
                      />
                  </CarouselItem>
                ))}
              </CarouselContent>
              {imageMedia.length > 1 && (
                <>
                  <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white" />
                  <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white" />
                </>
              )}
            </Carousel>
             <Button asChild variant="ghost" size="icon" className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 rounded-full h-9 w-9">
                <DialogTrigger><X className="h-5 w-5 text-white"/></DialogTrigger>
            </Button>
          </DialogContent>
        </Dialog>
      )}

      <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/70 to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-4 left-4 z-20 flex flex-col items-center">
        <Button variant="ghost" size="icon" onClick={onLikeToggle} disabled={isVisitor} className="h-auto p-1 rounded-full hover:bg-black/40">
          <Heart className={cn('h-7 w-7 transition-all', isLiked ? 'text-red-500 fill-current' : 'text-white')} />
        </Button>
        <span className="text-white text-xs font-bold drop-shadow-lg mb-2">{post.likes ? Object.keys(post.likes).length : 0}</span>
        
        <Button variant="ghost" size="icon" onClick={onToggleComments} className="h-auto p-1 rounded-full hover:bg-black/40">
          <MessageSquare className="h-7 w-7 text-white" />
        </Button>
        <span className="text-white text-xs font-bold drop-shadow-lg">{post.comments ? Object.keys(post.comments).length : 0}</span>
      </div>
    </div>
  );
}


// =================================================================================================
// 2. Componente Principal PostCard (Refactorizado)
// =================================================================================================

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  isPriority?: boolean;
  onLikeToggle: (postId: string) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onDeletePost: (postId: string) => void;
}

export function PostCard({ post, currentUser, isPriority = false, onLikeToggle, onAddComment, onDeletePost }: PostCardProps) {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const authorName = post.authorName || 'Usuario Desconocido';
  const authorAvatar = post.authorAvatar || 'https://avatar.vercel.sh/unknown.png';
  const isVisitor = !currentUser || currentUser.id === 'visitor';

  const handleLike = () => {
    if (isVisitor) return;
    onLikeToggle(post.id);
  };

  const handleAddComment = () => {
    if (isVisitor || !commentText.trim() || commentText.length > COMMENT_CHAR_LIMIT) return;
    onAddComment(post.id, commentText);
    setCommentText('');
    setShowComments(true);
  };

  const toggleCommentExpansion = (commentId: string) => {
    setExpandedComments(prev => ({ ...prev, [commentId]: true }));
  };
  
  const isPinned = !!(post.isPinned && post.pinnedUntil && new Date(post.pinnedUntil) > new Date());
  const canDelete = !!(currentUser?.id === post.authorId || currentUser?.role === 'admin');

  const { media, content } = post;
  const hasMedia = media && media.length > 0;
  const hasContent = content && content.trim() !== '';
  const isLiked = !!(currentUser && post.likes && post.likes[currentUser.id]);

  if (!post.authorName) {
    return (
      <div className="relative mt-6">
        <div className="absolute top-0 left-4 z-10 transform -translate-y-1/2">
          <Skeleton className="w-12 h-12 rounded-full border-2 border-background" />
        </div>
        <Card>
          <div className="h-6" />
          <Skeleton className="h-[250px] w-full" />
          <div className="p-4"><Skeleton className="h-4 w-full mb-2" /><Skeleton className="h-4 w-3/4" /></div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative mt-6 z-0">
      <div className="absolute top-0 left-0 right-0 w-full z-10 px-4 flex justify-between items-start pointer-events-none">
          <div className="flex items-start gap-3 pointer-events-auto">
              <div className="transform -translate-y-1/2">
                  <Link href={`/profile/${post.authorId}`}>
                  <Avatar className="w-12 h-12 border-4 border-accent-red">
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
        <CardContent className="p-0">
          {hasMedia && (
            <MediaContent 
              post={post}
              canDelete={canDelete}
              isPinned={isPinned}
              isPriority={isPriority}
              isVisitor={isVisitor}
              isLiked={isLiked}
              onDeletePost={onDeletePost}
              onLikeToggle={handleLike}
              onToggleComments={() => setShowComments(!showComments)}
            />
          )}
          {hasContent && (
            !hasMedia ? (
                <div className="border-t-4 border-accent-red">
                  <div className={cn("flex items-center justify-between px-6 py-3 border-b-4 border-accent-blue")}>
                      <p className="text-sm whitespace-pre-wrap flex-grow mr-4">{content}</p>
                      <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="flex items-center">
                              <Button variant="ghost" size="icon" onClick={handleLike} disabled={isVisitor} className="h-8 w-8 mr-1">
                                  <Heart className={cn("h-5 w-5", isLiked ? 'text-red-500 fill-current' : 'text-muted-foreground')} />
                              </Button>
                              <span className="text-sm text-muted-foreground">{post.likes ? Object.keys(post.likes).length : 0}</span>
                          </div>
                          <div className="flex items-center">
                              <Button variant="ghost" size="icon" onClick={() => setShowComments(!showComments)} className="h-8 w-8 mr-1">
                                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                              </Button>
                              <span className="text-sm text-muted-foreground">{post.comments ? Object.keys(post.comments).length : 0}</span>
                          </div>
                      </div>
                  </div>
                </div>
            ) : (
                <p className="px-6 py-4 text-sm whitespace-pre-wrap border-b-4 border-accent-blue">{content}</p>
            )
          )}
        </CardContent>
        
        <CardFooter className="flex-col items-start pt-2">
          {showComments && (
            <div className="w-full space-y-3 pt-4 mt-4 border-t px-4">
              {post.comments && Object.values(post.comments).map((comment) => {
                const commentId = `${post.id}-${comment.authorId}-${comment.createdAt}`; // synthetic key
                const isLong = comment.content.length > COMMENT_TRUNCATE_LENGTH;
                const isExpanded = !!expandedComments[commentId];

                return (
                  <div key={commentId} className="flex items-center justify-between w-full text-sm gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-8 w-8 flex-shrink-0"><AvatarImage src={comment.authorAvatar} /><AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback></Avatar>
                      <div className={cn("flex-grow", { "whitespace-pre-wrap": isExpanded })}>
                        <Link href={`/profile/${comment.authorId}`} className="hover:underline font-semibold mr-1">{comment.authorName}</Link>
                        <span className="text-muted-foreground">: {!isExpanded && isLong ? `${comment.content.substring(0, COMMENT_TRUNCATE_LENGTH)}...` : comment.content}</span>
                        {isLong && !isExpanded && (
                            <button onClick={() => toggleCommentExpansion(commentId)} className="text-blue-500 hover:underline ml-1 text-xs font-semibold">ver más</button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground flex-shrink-0">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}</p>
                  </div>
                );
              })}
            </div>
          )}
          {!isVisitor && (
            <div className="w-full pt-4 mt-4 border-t px-4">
              <div className="flex w-full items-center gap-2">
                <Avatar className="h-8 w-8"><AvatarImage src={currentUser?.avatar} /><AvatarFallback>{currentUser?.name ? currentUser.name.charAt(0) : ''}</AvatarFallback></Avatar>
                <Input placeholder="Escribe un comentario..." className="h-9" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} maxLength={COMMENT_CHAR_LIMIT}/>
                <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim() || commentText.length > COMMENT_CHAR_LIMIT}>Publicar</Button>
              </div>
              <div className="text-right text-xs text-muted-foreground mt-1 pr-14">
                <span className={cn({ "text-red-500": commentText.length > COMMENT_CHAR_LIMIT })}>{commentText.length} / {COMMENT_CHAR_LIMIT}</span>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

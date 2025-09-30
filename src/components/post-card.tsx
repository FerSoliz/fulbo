'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Heart, MessageSquare, Bookmark, MoreHorizontal, Play, Pencil, Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Post, User } from '@/lib/data';
import { cn } from '@/lib/utils';

interface PostCardProps {
  post: Post;
  currentUser: User | null;
  allUsers: User[];
  onLikeToggle: (postId: string, currentLikes: string[]) => void;
  onAddComment: (postId: string, commentText: string) => void;
  onDeletePost: (postId: string) => void;
}

export function PostCard({ post, currentUser, allUsers, onLikeToggle, onAddComment, onDeletePost }: PostCardProps) {
  const author = allUsers.find(u => u.id === post.authorId);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  if (!author) return null;

  const handleLike = () => {
    if (!currentUser || currentUser.id === 'visitor') return;
    onLikeToggle(post.id, post.likes);
  };

  const handleAddComment = () => {
    if (!currentUser || currentUser.id === 'visitor' || !commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
    setShowComments(true);
  };
  
  const isPinned = post.isPinned && post.pinnedUntil && new Date(post.pinnedUntil) > new Date();
  const isLiked = currentUser ? post.likes.includes(currentUser.id) : false;
  const canDelete = currentUser?.id === post.authorId || currentUser?.role === 'admin';
  const isVisitor = !currentUser || currentUser.id === 'visitor';

  const renderMedia = () => {
    // ... (El resto del código de renderMedia no cambia)
    const { media } = post;
    if (!media || media.length === 0) return null;

    const videoItem = media.find(item => item.type === 'video');
    if (videoItem) {
      const isTwitch = videoItem.videoType === 'twitch' && videoItem.videoId;
      const twitchUrl = `https://www.twitch.tv/${videoItem.videoId}`;
      const VideoPreview = () => (
          <div className="relative cursor-pointer group aspect-video bg-muted overflow-hidden">
              <Image src={videoItem.url} alt="Video thumbnail" fill className="object-contain" onError={(e) => { e.currentTarget.src = 'https://placehold.co/1280x720/211536/9386b8?text=Stream+Offline'; }}/>
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-16 w-16 text-white group-hover:scale-110 transition-transform" /></div>
          </div>
      );
      return isTwitch ? (
          <Link href={twitchUrl} target="_blank" rel="noopener noreferrer"><VideoPreview /></Link>
      ) : (
          <Dialog>
              <DialogTrigger asChild><VideoPreview /></DialogTrigger>
              <DialogContent className="max-w-4xl p-0"><div className="aspect-video">{videoItem.videoType === 'youtube' && videoItem.videoId && <iframe src={`https://www.youtube.com/embed/${videoItem.videoId}`} title="YouTube video player" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full"></iframe>}</div></DialogContent>
          </Dialog>
      );
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
                        <div key={index} className={cn("relative bg-muted", imageCount === 3 && index === 0 && "row-span-2", imageCount === 1 ? "aspect-video" : "aspect-square")}>
                            <Image src={item.url} alt={`Post media ${index + 1}`} fill className="object-contain" />
                            {index === 3 && imageCount > 4 && (<div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-3xl font-bold">+{imageCount - 4}</div>)}
                        </div>
                    ))}
                </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] p-2">
                 <Carousel className="w-full h-full">
                    <CarouselContent className="h-full">
                        {imageMedia.map((item, index) => (<CarouselItem key={index} className="flex items-center justify-center h-full"><Image src={item.url} alt={`Post media ${index + 1}`} width={1920} height={1080} className="max-h-full w-auto object-contain" /></CarouselItem>))}
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
        <CardHeader className="flex flex-row items-center gap-4">
            <Link href={`/profile/${author.id}`}><Avatar><AvatarImage src={author.avatar} alt={author.name} /><AvatarFallback>{author.name.charAt(0)}</AvatarFallback></Avatar></Link>
            <div className="flex-1">
                <Link href={`/profile/${author.id}`} className="hover:underline"><p className="font-semibold text-sm">{author.name}</p></Link>
                <p className="text-xs text-muted-foreground">{author.location} · {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: es })}</p>
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
        
        <CardContent className="p-0">
            {post.content && <p className="px-6 pb-4 text-sm whitespace-pre-wrap">{post.content}</p>}
            {renderMedia()}
        </CardContent>

        <CardFooter className="flex-col items-start">
             <div className="flex justify-between w-full pb-2 border-b">
                <div className="flex items-center gap-4">
                    <div className="flex items-center">
                        <Button variant="ghost" size="icon" onClick={handleLike} disabled={isVisitor}><Heart className={cn("h-5 w-5", isLiked && 'text-red-500 fill-current')} /></Button>
                        {post.likes.length > 0 ? (
                            <Dialog>
                                <DialogTrigger asChild><span className="text-sm font-medium text-muted-foreground cursor-pointer hover:underline">{post.likes.length} {post.likes.length === 1 ? 'Me gusta' : 'Me gusta'}</span></DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader><DialogTitle>Le gusta a</DialogTitle></DialogHeader>
                                    <div className="flex flex-col gap-4 py-4 max-h-[400px] overflow-y-auto">
                                        {post.likes.map(userId => {
                                            const userWhoLiked = allUsers.find(u => u.id === userId);
                                            if (!userWhoLiked) return null;
                                            return (<div key={userWhoLiked.id} className="flex items-center gap-4"><Link href={`/profile/${userWhoLiked.id}`}><Avatar><AvatarImage src={userWhoLiked.avatar} alt={userWhoLiked.name} /><AvatarFallback>{userWhoLiked.name.charAt(0)}</AvatarFallback></Avatar></Link><Link href={`/profile/${userWhoLiked.id}`} className="font-semibold hover:underline">{userWhoLiked.name}</Link></div>);
                                        })}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        ) : <span className="text-sm font-medium text-muted-foreground">0 Me gusta</span>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowComments(!showComments)}><MessageSquare className="h-5 w-5" /><span className="ml-2 text-sm">{post.comments.length}</span></Button>
                </div>
                <Button variant="ghost" size="sm" disabled={isVisitor}><Bookmark className="h-5 w-5" /></Button>
            </div>

            {showComments && (
                <div className="w-full space-y-4 pt-4">
                    {post.comments.map(comment => {
                        const commentAuthor = allUsers.find(u => u.id === comment.authorId);
                        return commentAuthor ? (<div key={comment.id} className="flex items-start gap-3"><Avatar className="h-8 w-8"><AvatarImage src={commentAuthor.avatar} /><AvatarFallback>{commentAuthor.name.charAt(0)}</AvatarFallback></Avatar><div className="bg-muted p-3 rounded-lg w-full"><Link href={`/profile/${commentAuthor.id}`} className="hover:underline"><span className="font-semibold text-sm">{commentAuthor.name}</span></Link><p className="text-sm text-muted-foreground">{comment.content}</p></div></div>) : null;
                    })}
                </div>
            )}
            {!isVisitor && (
                <div className="flex w-full items-center gap-2 pt-4">
                    <Avatar className="h-8 w-8"><AvatarImage src={currentUser?.avatar} /><AvatarFallback>{currentUser?.name.charAt(0)}</AvatarFallback></Avatar>
                    <Input placeholder="Escribe un comentario..." className="h-9" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}/>
                    <Button size="sm" onClick={handleAddComment} disabled={!commentText.trim()}>Publicar</Button>
                </div>
            )}
        </CardFooter>
    </Card>
  );
}

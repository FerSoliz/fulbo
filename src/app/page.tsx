'use client';

import { CreatePostForm } from '@/components/create-post-form';
import { PostCard } from '@/components/post-card';
import { Post } from '@/lib/types';
import { useUser } from '@/context/user-context';
import { useToast } from '@/hooks/use-toast';
import { PostCardSkeleton } from '@/components/post-card-skeleton';
import {
  createPost,
  togglePostLike,
  addCommentToPost,
  deletePost,
} from '@/lib/firebase/db/posts';
import { usePosts } from '@/hooks/use-posts'; // ¡Nuestro nuevo hook!
import { canDeleteAnyPost } from '@/lib/auth/roles';

export default function HomePage() {
  const { user: currentUser, loading: userContextLoading } = useUser();
  const { posts, status: postsStatus } = usePosts(); // ¡Aquí está la magia!
  const { toast } = useToast();

  const handleAddPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'authorName' | 'authorAvatar' | 'authorUsername'>) => {
    if (!currentUser || currentUser.id === 'visitor') return;

    const author = {
      id: currentUser.id,
      name: currentUser.name,
      avatar: currentUser.avatar,
      username: currentUser.username,
    };

    try {
      await createPost({ ...postData, author });
      toast({ title: "Publicación creada", description: "Tu publicación ha sido añadida al feed." });
    } catch (error: any) {
      console.error("Error al añadir publicación: ", error);
      toast({ title: "Error de publicación", description: `No se pudo crear la publicación: ${error.message}.`, variant: "destructive" });
    }
  };

  const handleLikeToggle = async (postId: string) => {
    if (!currentUser || currentUser.id === 'visitor') {
      toast({ title: "Inicia sesión", description: "Debes iniciar sesión para reaccionar.", variant: "destructive" });
      return;
    }

    try {
      await togglePostLike(postId, currentUser);
    } catch (error: any) {
      console.error("Error al actualizar like: ", error);
      toast({ title: "Error de red", description: `No se pudo guardar tu reacción: ${error.message}.`, variant: "destructive" });
    }
  };

  const handleAddComment = async (postId: string, commentText: string) => {
    if (!currentUser || currentUser.id === 'visitor') {
      toast({ title: "Inicia sesión", description: "Debes iniciar sesión para comentar.", variant: "destructive" });
      return;
    }
    if (!commentText.trim()) return;

    try {
      await addCommentToPost(postId, commentText, currentUser);
      toast({ title: "Comentario publicado" });
    } catch (error: any) {
      console.error("Error al añadir comentario: ", error);
      toast({ title: "Error al comentar", description: `No se pudo publicar tu comentario: ${error.message}.`, variant: "destructive" });
    }
  };

  const handleDeletePost = async (postId: string) => {
    const postToDelete = posts.find((p) => p.id === postId);
    if (!currentUser || (!canDeleteAnyPost(currentUser) && currentUser.id !== postToDelete?.authorId)) {
      toast({ title: "Acceso denegado", description: "No tienes permiso para eliminar esta publicación.", variant: "destructive" });
      return;
    }

    try {
      await deletePost(postId);
      toast({ title: "Publicación eliminada" });
    } catch (error: any) {
      console.error("Error al eliminar publicación: ", error);
      toast({ title: "Error al eliminar", description: `No se pudo eliminar la publicación: ${error.message}.`, variant: "destructive" });
    }
  };

  const canPost = !!currentUser && currentUser.id !== 'visitor';

  return (
    <div className="max-w-2xl mx-auto p-4" aria-live="polite" aria-busy={postsStatus === 'loading' || userContextLoading}>
      {currentUser && canPost && <CreatePostForm currentUser={currentUser} onAddPost={handleAddPost} />}

      <div className="space-y-12 mt-12">
        {userContextLoading || postsStatus === 'loading' ? (
          Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onLikeToggle={handleLikeToggle}
              onAddComment={handleAddComment}
              onDeletePost={handleDeletePost}
            />
          ))
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>Aún no hay publicaciones.</p>
            {canPost && <p>¡Sé el primero en compartir algo!</p>}
          </div>
        )}
      </div>
    </div>
  );
}

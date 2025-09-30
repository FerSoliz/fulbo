'use client';

import { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/create-post-form';
import { PostCard } from '@/components/post-card';
import { Post, Comment } from '@/lib/data';
import { useUser } from '@/context/user-context';
import { rtdb, ref, onValue, push, set, remove, update } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { PostCardSkeleton } from '@/components/post-card-skeleton';

type LoadingState = { 
  status: 'idle' | 'loading' | 'success' | 'error';
  data: Post[];
};

export default function HomePage() {
  const { user: currentUser, allUsers } = useUser();
  const [loadingState, setLoadingState] = useState<LoadingState>({ status: 'idle', data: [] });
  const { toast } = useToast();

  useEffect(() => {
    setLoadingState({ status: 'loading', data: [] });
    const postsRef = ref(rtdb, 'posts');

    const unsubscribe = onValue(postsRef, (snapshot) => {
      try {
        const data = snapshot.val();
        const postsList: Post[] = [];

        if (data) {
          Object.keys(data).forEach(key => {
            const postData = data[key];
            postsList.push({
              id: key,
              ...postData,
              media: postData.media || [],
              likes: postData.likes ? Object.keys(postData.likes) : [],
              comments: postData.comments ? Object.values(postData.comments).map((c: any, index: number) => ({ ...c, id: Object.keys(postData.comments)[index] })) : [],
            });
          });
        }

        const now = new Date();
        const pinned = postsList.filter(p => p.isPinned && p.pinnedUntil && new Date(p.pinnedUntil) > now);
        const unpinned = postsList.filter(p => !pinned.includes(p));

        pinned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        unpinned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setLoadingState({ status: 'success', data: [...pinned, ...unpinned] });
      } catch (error) {
        console.error("Error procesando datos de RTDB: ", error);
        toast({ title: "Error de datos", description: "Hubo un problema al procesar las publicaciones.", variant: "destructive" });
        setLoadingState({ status: 'error', data: [] });
      }
    }, (error) => {
      console.error("Error al cargar publicaciones de RTDB: ", error);
      toast({ title: "Error de conexión", description: "No se pudieron cargar las publicaciones.", variant: "destructive" });
      setLoadingState({ status: 'error', data: [] });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleAddPost = async (postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
     if (!currentUser || currentUser.id === 'visitor' || currentUser.role === 'player') return;

    const postToSave = {
      ...postData,
      authorId: currentUser.id,
      createdAt: new Date().toISOString(),
      likes: {}, 
      comments: {},
    };

    try {
      await push(ref(rtdb, 'posts'), postToSave);
      toast({ title: "Publicación creada", description: "Tu publicación ha sido añadida al feed." });
    } catch (error: any) {
      console.error("Error al añadir publicación en RTDB: ", error);
      toast({ title: "Error de publicación", description: `No se pudo crear la publicación: ${error.message}.`, variant: "destructive" });
    }
  };

  const handleLikeToggle = async (postId: string, currentLikes: string[]) => {
    if (!currentUser || currentUser.id === 'visitor') {
        toast({ title: "Inicia sesión", description: "Debes iniciar sesión para reaccionar.", variant: "destructive"});
        return;
    }
    const userId = currentUser.id;
    const postLikesRef = ref(rtdb, `posts/${postId}/likes/${userId}`);

    try {
        if (currentLikes.includes(userId)) {
            await remove(postLikesRef);
        } else {
            await set(postLikesRef, true);
        }
    } catch(error: any) {
        console.error("Error al actualizar like en RTDB: ", error);
        toast({ title: "Error de red", description: `No se pudo guardar tu reacción: ${error.message}.`, variant: "destructive" });
    }
  };

  const handleAddComment = async (postId: string, commentText: string) => {
    if (!currentUser || currentUser.id === 'visitor') {
        toast({ title: "Inicia sesión", description: "Debes iniciar sesión para comentar.", variant: "destructive"});
        return;
    }
    if (!commentText.trim()) return;

    const commentsRef = ref(rtdb, `posts/${postId}/comments`);
    const newCommentRef = push(commentsRef);

    const newComment: Omit<Comment, 'id'> = {
        authorId: currentUser.id,
        content: commentText,
        createdAt: new Date().toISOString(),
    };

    try {
        await set(newCommentRef, newComment);
        toast({ title: "Comentario publicado" });
    } catch(error: any) {
        console.error("Error al añadir comentario en RTDB: ", error);
        toast({ title: "Error al comentar", description: `No se pudo publicar tu comentario: ${error.message}.`, variant: "destructive" });
    }
  };

  const handleDeletePost = async (postId: string) => {
    // La lógica de permisos ya está en el PostCard, pero una doble verificación nunca está de más.
    const postToDelete = loadingState.data.find(p => p.id === postId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== postToDelete?.authorId)) {
      toast({ title: "Acceso denegado", description: "No tienes permiso para eliminar esta publicación.", variant: "destructive" });
      return;
    }
    try {
      await remove(ref(rtdb, `posts/${postId}`));
      toast({ title: "Publicación eliminada" });
    } catch (error: any) {
      console.error("Error al eliminar publicación de RTDB: ", error);
      toast({ title: "Error al eliminar", description: `No se pudo eliminar la publicación: ${error.message}.`, variant: "destructive" });
    }
  };

  const canPost = currentUser?.role === 'admin' || currentUser?.role === 'captain';

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4" aria-live="polite" aria-busy={loadingState.status === 'loading'}>
      {currentUser && canPost && <CreatePostForm currentUser={currentUser} onAddPost={handleAddPost} />}

      <div className="space-y-4">
        {loadingState.status === 'loading' ? (
          Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
        ) : loadingState.data.length > 0 ? (
          loadingState.data.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onLikeToggle={handleLikeToggle} // Prop actualizada
              onAddComment={handleAddComment} // Prop nueva
              onDeletePost={handleDeletePost}
              allUsers={allUsers}
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

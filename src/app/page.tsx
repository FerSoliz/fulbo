'use client';

import { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/create-post-form';
import { PostCard } from '@/components/post-card';
import { Post } from '@/lib/data';
import { useUser } from '@/context/user-context';
import { rtdb, ref, onValue, push, set, remove, update } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const { user: currentUser, allUsers } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Cargar datos desde Realtime Database
  useEffect(() => {
    setLoading(true);
    const postsRef = ref(rtdb, 'posts');

    // onValue escucha en tiempo real
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convertir el objeto de posts a un array
        const postsList: Post[] = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));

        // Ordenar posts: primero los fijados, luego por fecha de creación descendente
        const now = new Date();
        const pinned: Post[] = [];
        const unpinned: Post[] = [];

        postsList.forEach(post => {
          if (post.isPinned && post.pinnedUntil && new Date(post.pinnedUntil) > now) {
            pinned.push(post);
          } else {
            unpinned.push(post);
          }
        });

        // Ordenar ambos grupos por fecha de creación
        pinned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        unpinned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setPosts([...pinned, ...unpinned]);
      } else {
        setPosts([]); // No hay posts
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching posts from RTDB: ", error);
      toast({
        title: "Error al cargar publicaciones",
        description: "Hubo un problema al intentar cargar las publicaciones.",
        variant: "destructive",
      });
      setLoading(false);
    });

    // Limpiar el listener al desmontar el componente
    return () => unsubscribe();
  }, [toast]);

  const handleAddPost = async (newPostData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    if (!currentUser || currentUser.role === 'player') {
      toast({
        title: "Error de autorización",
        description: "Solo administradores y capitanes pueden crear publicaciones.",
        variant: "destructive",
      });
      return;
    }

    let pinnedUntil: string | null = null;
    if (newPostData.isPinned) {
      const expiryDate = new Date();
      expiryDate.setHours(expiryDate.getHours() + 12);
      pinnedUntil = expiryDate.toISOString();
    }

    const postToSave: Omit<Post, 'id'> = {
      ...newPostData,
      createdAt: new Date().toISOString(),
      likes: {}, // Inicializar como objeto vacío
      comments: {}, // Inicializar como objeto vacío
      pinnedUntil: pinnedUntil,
    };

    try {
      const postsRef = ref(rtdb, 'posts');
      const newPostRef = push(postsRef); // Genera un ID único
      await set(newPostRef, postToSave);

      toast({
        title: "Publicación exitosa",
        description: "Tu publicación ha sido creada correctamente.",
      });
    } catch (error: any) {
      console.error("Error saving post to RTDB: ", error);
      toast({
        title: "Error de publicación",
        description: error.message || "Hubo un problema al crear la publicación.",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePost = async (updatedPost: Post) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'captain') {
      toast({
        title: "Error de autorización",
        description: "No tienes permiso para actualizar esta publicación.",
        variant: "destructive",
      });
      return;
    }
    try {
      const postRef = ref(rtdb, `posts/${updatedPost.id}`);
      // No es necesario enviar el ID dentro del objeto a actualizar
      const { id, ...postData } = updatedPost;
      await update(postRef, postData);

      toast({
        title: "Publicación actualizada",
        description: "La publicación se ha actualizado correctamente.",
      });
    } catch (error: any) {
      console.error("Error updating post in RTDB: ", error);
      toast({
        title: "Error al actualizar",
        description: error.message || "Hubo un problema al actualizar la publicación.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'captain') {
      toast({
        title: "Error de autorización",
        description: "No tienes permiso para eliminar esta publicación.",
        variant: "destructive",
      });
      return;
    }
    try {
      const postRef = ref(rtdb, `posts/${postId}`);
      await remove(postRef);

      toast({
        title: "Publicación eliminada",
        description: "La publicación ha sido eliminada correctamente.",
      });
    } catch (error: any) {
      console.error("Error deleting post from RTDB: 
", error);
      toast({
        title: "Error al eliminar",
        description: error.message || "Hubo un problema al eliminar la publicación.",
        variant: "destructive",
      });
    }
  };

  const canPost = currentUser?.role === 'admin' || currentUser?.role === 'captain';

  return (
    <div className="max-w-2xl mx-auto space-y-4 p-4">
      {currentUser && canPost && (
        <CreatePostForm
          currentUser={currentUser}
          onAddPost={handleAddPost}
        />
      )}

      <div className="space-y-4">
        {loading ? (
          <p className="text-center text-muted-foreground py-10">Cargando publicaciones...</p>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              onUpdatePost={handleUpdatePost}
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

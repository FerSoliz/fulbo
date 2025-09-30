'use client';

import { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/create-post-form';
import { PostCard } from '@/components/post-card';
import { Post, User } from '@/lib/data';
import { useUser } from '@/context/user-context';
import { db, collection, getDocs, doc, deleteDoc, updateDoc, orderBy, query, addDoc } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const { user: currentUser, allUsers } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // IMPORTANTE: Dado que las operaciones de creación, actualización y eliminación de posts se realizan directamente desde el cliente,
  // es ABSOLUTAMENTE CRÍTICO implementar REGLAS DE SEGURIDAD ROBUSTAS en Firestore. Estas reglas deben verificar:
  // 1. Autenticación del usuario.
  // 2. Roles del usuario (solo 'admin' o 'captain' pueden crear/editar/eliminar posts).
  // 3. Validación de los datos del post (ej. tamaño máximo del contenido, tipo de media, etc.).
  // Sin estas reglas, cualquier usuario podría manipular la base de datos directamente.

  // Cargar datos desde Firestore
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsCollection = collection(db, 'posts');
        const postsQuery = query(postsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(postsQuery);
        let postsData = querySnapshot.docs.map(doc => ({ ...doc.data() as Post, id: doc.id }));
        
        // Separate pinned and unpinned posts
        const now = new Date();
        const pinned: Post[] = [];
        const unpinned: Post[] = [];

        postsData.forEach(post => {
          if (post.isPinned && post.pinnedUntil && new Date(post.pinnedUntil) > now) {
            pinned.push(post);
          } else {
            unpinned.push(post);
          }
        });
        
        // Sort pinned posts by creation date as well, then combine
        pinned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setPosts([...pinned, ...unpinned]);

      } catch (error) {
        console.error("Error fetching posts: ", error);
        toast({
          title: "Error al cargar publicaciones",
          description: "Hubo un problema al intentar cargar las publicaciones.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [toast]);


  const handleAddPost = async (newPostData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    console.log("handleAddPost: Iniciando...");
    console.log("Current User: ", currentUser);

    if (!currentUser || currentUser.id === 'visitor') {
      console.log("handleAddPost: Usuario no logueado o visitante.");
      toast({
        title: "Error de publicación",
        description: "Debes iniciar sesión para crear una publicación.",
        variant: "destructive",
      });
      return;
    }
    
    // Validar rol de usuario para publicar
    if (currentUser.role !== 'admin' && currentUser.role !== 'captain') {
      console.error("handleAddPost: Usuario no autorizado para crear publicaciones. Rol actual:", currentUser.role);
      toast({
        title: "Error de autorización",
        description: "Solo administradores y capitanes pueden crear publicaciones.",
        variant: "destructive",
      });
      return;
    }
    console.log("handleAddPost: Usuario autorizado con rol:", currentUser.role);

    let pinnedUntil: string | null = null;
    if (newPostData.isPinned) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 12);
        pinnedUntil = expiryDate.toISOString();
    }

    const postToSave = {
        ...newPostData,
        title: '',
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
        pinnedUntil: pinnedUntil,
    };
    console.log("handleAddPost: Objeto a guardar en Firestore:", postToSave);
    
    try {
        const postsCollection = collection(db, 'posts');
        const docRef = await addDoc(postsCollection, postToSave); // Intento de guardar en Firestore
        
        const newPost: Post = { 
          id: docRef.id,
          ...postToSave 
        } as Post;
        
        setPosts((prevPosts) => {
          const allPosts = [newPost, ...prevPosts];
          const now = new Date();
          const pinned: Post[] = [];
          const unpinned: Post[] = [];

          allPosts.forEach(post => {
            if (post.isPinned && post.pinnedUntil && new Date(post.pinnedUntil) > now) {
              pinned.push(post);
            } else {
              unpinned.push(post);
            }
          });
          
          pinned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          unpinned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          
          return [...pinned, ...unpinned];
        });

        toast({
          title: "Publicación exitosa",
          description: "Tu publicación ha sido creada correctamente.",
        });
        console.log("handleAddPost: Publicación guardada con éxito con ID:", docRef.id);

    } catch (error: any) { // Explicitly cast error to any for better logging flexibility
        console.error("--- ERROR AL INTENTAR GUARDAR EL POST EN FIRESTORE ---");
        console.error("Detalles del error:", error);
        // Si el error tiene un mensaje, lo mostramos, si no, un mensaje genérico.
        const errorMessage = error.message || "Hubo un problema desconocido al intentar crear la publicación.";
        toast({
          title: "Error de publicación",
          description: errorMessage,
          variant: "destructive",
        });
    }
  };

  const handleUpdatePost = async (updatedPost: Post) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'captain') {
      console.error("Usuario no autorizado para actualizar publicaciones. Rol actual:", currentUser?.role);
      toast({
        title: "Error de autorización",
        description: "Solo administradores y capitanes pueden actualizar publicaciones.",
        variant: "destructive",
      });
      return;
    }
    try {
        const postRef = doc(db, 'posts', updatedPost.id);
        await updateDoc(postRef, { ...updatedPost });
        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        );
        toast({
          title: "Publicación actualizada",
          description: "La publicación ha sido actualizada correctamente.",
        });
    } catch (error: any) {
        console.error("Error updating post: ", error);
        toast({
          title: "Error al actualizar",
          description: error.message || "Hubo un problema al intentar actualizar la publicación.",
          variant: "destructive",
        });
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'captain') {
      console.error("Usuario no autorizado para eliminar publicaciones. Rol actual:", currentUser?.role);
      toast({
        title: "Error de autorización",
        description: "Solo administradores y capitanes pueden eliminar publicaciones.",
        variant: "destructive",
      });
      return;
    }
     try {
        const postRef = doc(db, 'posts', postId);
        await deleteDoc(postRef);
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
        toast({
          title: "Publicación eliminada",
          description: "La publicación ha sido eliminada correctamente.",
        });
    } catch (error: any) {
        console.error("Error deleting post: ", error);
        toast({
          title: "Error al eliminar",
          description: error.message || "Hubo un problema al intentar eliminar la publicación.",
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

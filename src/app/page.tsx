'use client';

import { useState, useEffect, useCallback } from 'react'; // Importamos useCallback
import { CreatePostForm } from '@/components/create-post-form';
import { PostCard } from '@/components/post-card';
import { Post, User } from '@/lib/data';
import { useUser } from '@/context/user-context';
import {
  db,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  orderBy,
  query,
  addDoc,
} from '@/lib/firebase';
import { storage, ref, uploadBytes, getDownloadURL } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const { user: currentUser } = useUser(); // allUsers ya no se desestructura de useUser()
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [allUsersFromFirestore, setAllUsersFromFirestore] = useState<User[]>([]); // Nuevo estado para todos los usuarios
  const { toast } = useToast();

  // Cargar todos los usuarios desde Firestore para pasarlos a PostCard
  useEffect(() => {
    const fetchAllUsers = async () => {
      if (!db) {
        console.error("HomePage: !!! Firestore DB no está inicializada al cargar todos los usuarios !!!");
        toast({
          title: "Error de configuración",
          description: "Firestore DB no está disponible. Contacta al soporte.",
          variant: "destructive",
        });
        return;
      }
      try {
        const usersCollection = collection(db, 'users');
        const querySnapshot = await getDocs(usersCollection);
        const usersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as User[];
        setAllUsersFromFirestore(usersData);
        console.log("HomePage: Todos los usuarios cargados de Firestore.", usersData.length);
      } catch (error) {
        console.error("HomePage: Error al cargar todos los usuarios desde Firestore: ", error);
        toast({
          title: "Error al cargar usuarios",
          description: "No se pudo cargar la información de los usuarios para los posts.",
          variant: "destructive",
        });
      }
    };
    fetchAllUsers();
  }, [toast]); // Dependencia del toast

  // Cargar posts desde Firestore
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      if (!db) {
        console.error("HomePage: !!! Firestore DB no está inicializada al cargar posts !!!");
        toast({
          title: "Error de configuración",
          description: "Firestore DB no está disponible. Contacta al soporte.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      try {
        const postsCollection = collection(db, 'posts');
        const postsQuery = query(postsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(postsQuery);
        let postsData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Post[];

        const now = new Date();
        const pinned: Post[] = [];
        const unpinned: Post[] = [];

        postsData.forEach((post) => {
          if (post.isPinned && post.pinnedUntil && new Date(post.pinnedUntil) > now) {
            pinned.push(post);
          } else {
            unpinned.push(post);
          }
        });

        pinned.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setPosts([...pinned, ...unpinned]);
        console.log("HomePage: Posts cargados de Firestore.", postsData.length);
      } catch (error) {
        console.error("HomePage: Error fetching posts: ", error);
        toast({
          title: "Error al cargar publicaciones",
          description: "No se pudieron cargar las publicaciones del feed.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [toast]);

  // handleAddPost ahora es una función que pasamos al CreatePostForm
  const handleAddPost = useCallback(async (
    newPostData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'media'>,
    imageFile?: File | null,
  ) => {
    console.log("handleAddPost: Iniciando...");
    if (!currentUser || currentUser.id === 'visitor') {
      console.error("handleAddPost: Usuario no autenticado.");
      throw new Error("Debes iniciar sesión para publicar."); // Lanzar error para que el formulario lo capture
    }
    if (currentUser.role !== 'admin' && currentUser.role !== 'captain') {
      console.error(`handleAddPost: Usuario ${currentUser.id} con rol ${currentUser.role} no autorizado.`);
      throw new Error("Solo los administradores y capitanes pueden publicar en el feed.");
    }

    // Ya no configuramos setLoading(true) aquí, el formulario ya maneja su propio estado de subida
    try {
      let imageUrl: string | undefined = undefined;

      if (!db) {
        console.error("handleAddPost: !!! Firestore DB no está inicializada !!!");
        throw new Error("Firestore DB no disponible.");
      }
      if (!storage) {
        console.error("handleAddPost: !!! Firebase Storage no está inicializado !!!");
        throw new Error("Firebase Storage no disponible.");
      }

      // 1. Subir imagen a Firebase Storage si existe
      if (imageFile) {
        console.log("handleAddPost: Archivo de imagen detectado. Intentando subir a Storage...");
        // Aseguramos que currentUser.id no sea undefined/null aquí antes de usarlo
        const userId = currentUser.id;
        const storageRef = ref(storage, `post_images/${userId}/${Date.now()}_${imageFile.name}`);
        console.log("handleAddPost: Storage ref creado.", storageRef.fullPath);
        const uploadResult = await uploadBytes(storageRef, imageFile);
        console.log("handleAddPost: Imagen subida a Storage.", uploadResult.metadata.fullPath);
        imageUrl = await getDownloadURL(uploadResult.ref);
        console.log("handleAddPost: URL de descarga de imagen obtenida:", imageUrl);
      } else {
        console.log("handleAddPost: No hay archivo de imagen para subir.");
      }

      let pinnedUntil: string | undefined = undefined;
      if (newPostData.isPinned) {
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + 12);
        pinnedUntil = expiryDate.toISOString();
      }

      const mediaArray = imageUrl ? [{ type: 'image' as const, url: imageUrl }] : [];

      const baseNewPost = {
        ...newPostData,
        title: '',
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
        media: mediaArray,
        authorId: currentUser.id,
      };

      const postToSave: Omit<Post, 'id'> = pinnedUntil
        ? { ...baseNewPost, pinnedUntil: pinnedUntil }
        : baseNewPost;

      console.log("handleAddPost: Objeto de post final para guardar en Firestore.", postToSave);

      // 2. Guardar el post en Firestore, dejando que Firestore genere el ID
      console.log("handleAddPost: Intentando guardar post en Firestore...");
      const docRef = await addDoc(collection(db, 'posts'), postToSave);
      const newPost: Post = { ...postToSave, id: docRef.id };

      console.log("handleAddPost: Post guardado exitosamente en Firestore con ID:", docRef.id);

      // Actualizamos el estado local para reflejar el nuevo post
      setPosts((prevPosts) => {
        const allPosts = [newPost, ...prevPosts];
        const now = new Date();
        const pinned: Post[] = [];
        const unpinned: Post[] = [];

        allPosts.forEach((post) => {
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
      console.log("handleAddPost: Estado de posts actualizado localmente.");

    } catch (error: any) {
      console.error("handleAddPost: !!! ERROR CRÍTICO al añadir post a Firestore o subir imagen !!! ", error); 
      // Relanzar el error para que el `CreatePostForm` lo capture y muestre el toast
      throw error; 
    } finally {
      console.log("handleAddPost: Finalizado (se haya tenido éxito o error).");
    }
  }, [currentUser, db, storage]); // Dependencias para useCallback


  const handleUpdatePost = async (updatedPost: Post) => {
    if (!db) {
      toast({
        title: "Error de configuración",
        description: "Firestore DB no está disponible para actualizar.",
        variant: "destructive",
      });
      return;
    }
    try {
      const postId = typeof updatedPost.id === 'number' ? updatedPost.id.toString() : updatedPost.id;
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, { ...updatedPost });
      toast({
        title: "Publicación actualizada",
        description: "El post ha sido actualizado correctamente.",
      });
      setPosts((prevPosts) =>
        prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
      );
    } catch (error: any) {
      console.error("Error al actualizar post en Firestore: ", error);
      toast({
        title: "Error al actualizar",
        description: `No se pudo actualizar el post: ${error.message || error}.`,
        variant: "destructive",
      });
    }
  };

  const handleDeletePost = async (postId: string | number) => {
    if (!db) {
      toast({
        title: "Error de configuración",
        description: "Firestore DB no está disponible para eliminar.",
        variant: "destructive",
      });
      return;
    }
    try {
        const idToDelete = typeof postId === 'number' ? postId.toString() : postId;
        const postRef = doc(db, 'posts', idToDelete);
        await deleteDoc(postRef);
        toast({
            title: "Publicación eliminada",
            description: "El post ha sido eliminado correctamente.",
        });
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error: any) {
        console.error("Error al eliminar post de Firestore: ", error);
        toast({
            title: "Error al eliminar",
            description: `No se pudo eliminar el post: ${error.message || error}.`,
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
          posts.map((post) => {
            // Encuentra el autor para cada post usando allUsersFromFirestore
            const author = allUsersFromFirestore.find(u => u.id === post.authorId);
            return (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onUpdatePost={handleUpdatePost}
                onDeletePost={handleDeletePost}
                // Pasamos un array con el autor o un array vacío si no se encuentra
                allUsers={author ? [author] : []} 
                // O podrías pasar directamente el objeto author a PostCard si lo adaptas para ello
              />
            );
          })
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

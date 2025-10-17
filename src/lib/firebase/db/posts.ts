import { ref, get, set, remove, push, serverTimestamp, query, orderByChild } from 'firebase/database';
import { db } from '../../firebase';
import { Post, NewPostData, UserData } from '../../types';

/**
 * Obtiene todas las publicaciones del feed social, ordenadas por fecha de creación descendente.
 * @returns Una promesa que se resuelve con un array de Post.
 */
export const getPosts = async (): Promise<Post[]> => {
    const postsRef = ref(db, 'posts');
    const snapshot = await get(query(postsRef, orderByChild('createdAt')));
    if(snapshot.exists()) {
        const postsData = snapshot.val();
        return Object.keys(postsData)
            .map(key => ({ id: key, ...postsData[key] }))
            .sort((a, b) => b.createdAt - a.createdAt); // Ordenar de más reciente a más antiguo
    }
    return [];
};

/**
 * Crea una nueva publicación en el feed social.
 * @param postData Los datos de la nueva publicación.
 * @returns Una promesa que se resuelve cuando la operación se completa.
 */
export const createPost = async (postData: NewPostData): Promise<void> => {
  const { content, media, url, isPinned, author } = postData;

  const postToSave: any = {
    authorId: author.id,
    authorName: author.name,
    authorAvatar: author.avatar,
    authorUsername: author.username,
    createdAt: serverTimestamp(),
    content: content || '',
    ...(media && { media }),
    ...(url && { url }),
    likes: {},
    comments: {},
  };

  if (isPinned) {
    postToSave.isPinned = true;
    // La lógica de `pinnedUntil` podría necesitar ser ajustada según la implementación exacta.
    // Por simplicidad, se deja como estaba, asumiendo que es un timestamp del servidor + offset.
    postToSave.pinnedUntil = { '.sv': { 'timestamp': serverTimestamp() }, 'offset': 24 * 60 * 60 * 1000 };
  }

  await push(ref(db, 'posts'), postToSave);
};

/**
 * Alterna el estado de "me gusta" de un post por un usuario.
 * @param postId El ID del post.
 * @param user Los datos del usuario que dio o quitó el "me gusta".
 * @returns Una promesa que se resuelve cuando la operación se completa.
 */
export const togglePostLike = async (postId: string, user: UserData): Promise<void> => {
  const postLikeRef = ref(db, `posts/${postId}/likes/${user.id}`);
  const snapshot = await get(postLikeRef);

  if (snapshot.exists()) {
    await remove(postLikeRef);
  } else {
    const likeData = {
      name: user.name,
      avatar: user.avatar,
      username: user.username,
    };
    await set(postLikeRef, likeData);
  }
};

/**
 * Añade un comentario a un post.
 * @param postId El ID del post.
 * @param commentText El texto del comentario.
 * @param author Los datos del autor del comentario.
 * @returns Una promesa que se resuelve cuando la operación se completa.
 */
export const addCommentToPost = async (postId: string, commentText: string, author: UserData): Promise<void> => {
  const commentsRef = ref(db, `posts/${postId}/comments`);
  const newCommentRef = push(commentsRef);

  const commentData = {
    authorId: author.id,
    authorName: author.name,
    authorAvatar: author.avatar,
    authorUsername: author.username,
    content: commentText,
    createdAt: serverTimestamp(),
  };

  await set(newCommentRef, commentData);
};

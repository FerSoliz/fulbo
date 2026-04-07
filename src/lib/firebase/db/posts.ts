
import { db } from '@/lib/firebase';
import { Post, UserProfile } from '@/lib/types';
import {
  ref,
  onValue,
  remove,
  query,
  orderByChild,
  push,
  serverTimestamp,
  update,
  get,
} from 'firebase/database';

/**
 * Subscribes to the posts feed in real-time.
 * @param callback - Function to call with the posts list whenever it updates.
 * @returns An unsubscribe function to stop listening for updates.
 */
export const subscribeToPosts = (callback: (posts: Post[]) => void) => {
  const postsQuery = query(ref(db, 'posts'), orderByChild('createdAt'));

  const listener = onValue(
    postsQuery,
    (snapshot) => {
      try {
        const postsList: Post[] = [];
        snapshot.forEach((childSnapshot) => {
          postsList.push({ id: childSnapshot.key!, ...childSnapshot.val() });
        });

        const now_ts = new Date().getTime();
        const pinned = postsList.filter(p => p.isPinned && p.pinnedUntil && Number(p.pinnedUntil) > now_ts);
        const unpinned = postsList.filter(p => !p.isPinned || !p.pinnedUntil || Number(p.pinnedUntil) <= now_ts);

        const sortedPosts = [...pinned, ...unpinned].reverse();
        
        callback(sortedPosts);

      } catch (error) {
        console.error("Error processing posts data: ", error);
        callback([]);
      }
    },
    (error) => {
      console.error("Error fetching posts from RTDB: ", error);
      callback([]);
    }
  );

  return listener;
};

/**
 * Creates a new post in the database.
 */
export const createPost = async (
    postData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'> & { author: Pick<UserProfile, 'id' | 'name' | 'avatar' | 'username'> }
) => {
  const { author, ...restOfPost } = postData;

  const newPostDataRaw = {
    ...restOfPost,
    authorId: author.id,
    authorName: author.name,
    authorAvatar: author.avatar,
    authorUsername: author.username,
    createdAt: serverTimestamp(),
  };

  const newPostData = Object.fromEntries(
    Object.entries(newPostDataRaw).filter(([, value]) => value !== undefined)
  );

  const newPostRef = push(ref(db, 'posts'));
  await update(newPostRef, newPostData);
  return newPostRef.key;
};


/**
 * Toggles a like on a post.
 */
export const togglePostLike = async (postId: string, user: Pick<UserProfile, 'id' | 'name' | 'avatar' | 'username'>) => {
    const postLikesRef = ref(db, `posts/${postId}/likes/${user.id}`);
    const snapshot = await get(postLikesRef);

    if (snapshot.exists()) {
        await remove(postLikesRef);
    } else {
        await update(ref(db, `posts/${postId}/likes`), {
            [user.id]: {
                name: user.name,
                avatar: user.avatar,
                username: user.username,
            }
        });
    }
};

/**
 * Adds a comment to a post.
 */
export const addCommentToPost = async (
    postId: string,
    commentText: string,
    author: Pick<UserProfile, 'id' | 'name' | 'avatar' | 'username'>
) => {
    const commentsRef = ref(db, `posts/${postId}/comments`);
    const newCommentRef = push(commentsRef);

    await update(newCommentRef, {
        authorId: author.id,
        authorName: author.name,
        authorAvatar: author.avatar,
        authorUsername: author.username,
        content: commentText, // <-- ¡Este es el cambio!
        createdAt: serverTimestamp(),
    });
};

/**
 * Deletes a post from the database.
 */
export const deletePost = async (postId: string): Promise<void> => {
  const postRef = ref(db, `posts/${postId}`);
  await remove(postRef);
};

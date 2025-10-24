
import { useState, useEffect } from 'react';
import { Post } from '@/lib/types';
import { subscribeToPosts } from '@/lib/firebase/db/posts';

export type PostsStatus = 'loading' | 'success' | 'error';

/**
 * Custom hook to get real-time posts from the database.
 * It handles loading and error states automatically.
 */
export const usePosts = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [status, setStatus] = useState<PostsStatus>('loading');

  useEffect(() => {
    // Set status to loading initially
    setStatus('loading');

    // Subscribe to posts and get the unsubscribe function
    const unsubscribe = subscribeToPosts((updatedPosts) => {
      if (updatedPosts) {
        setPosts(updatedPosts);
        setStatus('success');
      } else {
        setPosts([]);
        setStatus('error');
      }
    });

    // Cleanup function: unsubscribe when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once

  return { posts, status };
};


'use client';

import { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/create-post-form';
import { PostCard } from '@/components/post-card';
import { Post, User } from '@/lib/data';
import { useUser } from '@/context/user-context';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc, orderBy, query } from 'firebase/firestore';

export default function HomePage() {
  const { user: currentUser, allUsers } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Cargar datos desde Firestore
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const postsCollection = collection(db, 'posts');
        const postsQuery = query(postsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(postsQuery);
        const postsData = querySnapshot.docs.map(doc => doc.data() as Post);
        setPosts(postsData);
      } catch (error) {
        console.error("Error fetching posts: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);


  const handleAddPost = async (newPostData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    if (!currentUser || currentUser.id === 'visitor') return;
    const newPost: Post = {
        ...newPostData,
        authorId: currentUser.id,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
    };
    
    try {
        const postRef = doc(db, 'posts', newPost.id.toString());
        await setDoc(postRef, newPost);
        setPosts((prevPosts) => [newPost, ...prevPosts]);
    } catch (error) {
        console.error("Error adding post: ", error);
    }
  };

  const handleUpdatePost = async (updatedPost: Post) => {
    try {
        const postRef = doc(db, 'posts', updatedPost.id.toString());
        await updateDoc(postRef, { ...updatedPost });
        setPosts((prevPosts) =>
          prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
        );
    } catch (error) {
        console.error("Error updating post: ", error);
    }
  };

  const handleDeletePost = async (postId: number) => {
     try {
        const postRef = doc(db, 'posts', postId.toString());
        await deleteDoc(postRef);
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
    } catch (error) {
        console.error("Error deleting post: ", error);
    }
  };

  const canPost = currentUser?.role === 'admin' || currentUser?.role === 'editor';

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

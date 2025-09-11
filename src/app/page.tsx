'use client';

import { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/create-post-form';
import { PostCard } from '@/components/post-card';
import { Post, User, users as initialUsers, posts as initialPosts } from '@/lib/data';

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Cargar datos desde localStorage al montar el componente
  useEffect(() => {
    // Cargar o establecer usuario actual
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      setCurrentUser(JSON.parse(userJson));
    } else {
      // Establecer un usuario por defecto si no hay ninguno
      const defaultUser = initialUsers[0];
      setCurrentUser(defaultUser);
      localStorage.setItem('currentUser', JSON.stringify(defaultUser));
    }

    // Cargar todos los usuarios (iniciales + almacenados)
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const combinedUsers = [...initialUsers, ...storedUsers];
    const uniqueUsers = Array.from(
      new Map(combinedUsers.map((user) => [user.id, user])).values()
    );
    setAllUsers(uniqueUsers);

    // Cargar publicaciones o establecer las iniciales si no hay ninguna guardada
    const savedPosts = localStorage.getItem('posts');
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    } else {
      setPosts(initialPosts);
    }
  }, []);

  // Persistir las publicaciones en localStorage cada vez que cambian
  useEffect(() => {
    if (posts.length > 0) {
      localStorage.setItem('posts', JSON.stringify(posts));
    }
  }, [posts]);

  const handleAddPost = (newPostData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    const newPost: Post = {
        ...newPostData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        likes: [],
        comments: [],
    };
    setPosts((prevPosts) => [newPost, ...prevPosts]);
  };

  const handleUpdatePost = (updatedPost: Post) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post))
    );
  };

  const handleDeletePost = (postId: number) => {
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
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
        {posts.length > 0 ? (
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

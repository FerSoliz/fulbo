'use client';

import { useState, useEffect } from 'react';
import { CreatePostForm } from '@/components/create-post-form';
import { PostCard } from '@/components/post-card';
import { Post, User, posts as initialPosts } from '@/lib/data';
import { useUser } from '@/context/user-context';


export default function HomePage() {
  const { user: currentUser, allUsers } = useUser();
  const [posts, setPosts] = useState<Post[]>([]);
  
  // Cargar datos desde localStorage y filtrar publicaciones antiguas
  useEffect(() => {
    const savedPostsJSON = localStorage.getItem('posts');
    let savedPosts: Post[] = [];

    if (savedPostsJSON) {
      savedPosts = JSON.parse(savedPostsJSON);
    } else {
      savedPosts = initialPosts;
    }

    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    const recentPosts = savedPosts.filter(post => {
        const postDate = new Date(post.createdAt);
        return postDate >= tenDaysAgo;
    });

    setPosts(recentPosts);
    
    // Opcionalmente, limpiar el localStorage de posts viejos
    if(savedPosts.length !== recentPosts.length) {
        localStorage.setItem('posts', JSON.stringify(recentPosts));
    }

  }, []);

  // Persistir las publicaciones en localStorage cada vez que cambian
  useEffect(() => {
    // Evita guardar el estado inicial vacío antes de que se carguen los posts
    if (posts.length > 0) {
      localStorage.setItem('posts', JSON.stringify(posts));
    }
  }, [posts]);

  const handleAddPost = (newPostData: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments'>) => {
    if (!currentUser || currentUser.id === 'visitor') return;
    const newPost: Post = {
        ...newPostData,
        authorId: currentUser.id,
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

import React, { useEffect, useState } from 'react';
import { getAllPosts, createPost, getPostWithAuthor } from '../../server/api/posts';
import { getAllUsers } from '../../server/api/users';
import { Post } from '../../shared/types/post.js';
import { User } from '../../shared/types/user.js';

export function PostList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<{
    post: Post;
    author: { id: string; name: string; email: string };
  } | null>(null);
  
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        const [postsData, usersData] = await Promise.all([
          getAllPosts(),
          getAllUsers()
        ]);
        
        setPosts(postsData);
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);
  
  const handleCreatePost = async () => {
    try {
      setError(null);
      
      if (users.length === 0) {
        setError('No users available to create posts');
        return;
      }
      
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomNum = Math.floor(Math.random() * 1000);
      
      const newPost = await createPost({
        title: `Sample Post ${randomNum}`,
        content: `This is a sample post created at ${new Date().toLocaleTimeString()}. It demonstrates the seamless RPC functionality between client and server.`,
        authorId: randomUser.id
      });
      
      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create post');
    }
  };
  
  const handleViewPost = async (postId: string) => {
    try {
      setError(null);
      const postData = await getPostWithAuthor(postId);
      setSelectedPost(postData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load post');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Posts ({posts.length})</h2>
        <button onClick={handleCreatePost} disabled={users.length === 0}>
          Create Random Post - Vite HMR!
        </button>
      </div>
      
      {selectedPost && (
        <div className="user-card" style={{ marginBottom: '20px', backgroundColor: '#e3f2fd' }}>
          <h3>{selectedPost.post.title}</h3>
          <p><strong>Author:</strong> {selectedPost.author.name} ({selectedPost.author.email})</p>
          <p><strong>Created:</strong> {new Date(selectedPost.post.createdAt).toLocaleString()}</p>
          <p>{selectedPost.post.content} xfxfffggg</p>
          <button onClick={() => setSelectedPost(null)}>Close</button>
        </div>
      )}
      
      {posts.length === 0 ? (
        <div>No posts found</div>
      ) : (
        <div>
          {posts.map(post => (
            <div key={post.id} className="user-card">
              <h3>{post.title}</h3>
              <p>{post.content.substring(0, 150)}{post.content.length > 150 ? '...' : ''}</p>
              <p><small>Created: {new Date(post.createdAt).toLocaleDateString()}</small></p>
              <button onClick={() => handleViewPost(post.id)}>
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Form } from '@seamless-rpc/core';
import { createUser } from '../../server/api/users';
import { createPost } from '../../server/api/posts';
import type { User, Post } from '../../shared/types';

export function FormDemo() {
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>TypeBridge Form Demo</h2>
      
      <div style={{ marginBottom: '40px' }}>
        <h3>Create User</h3>
        <Form 
          action={createUser}
          onSuccess={(user) => {
            setUsers(prev => [user, ...prev]);
            console.log('User created:', user);
          }}
          onError={(error) => {
            console.error('Error creating user:', error);
          }}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px',
            maxWidth: '300px' 
          }}
        >
          <input 
            name="name" 
            placeholder="User name" 
            required 
            style={{ padding: '8px' }}
          />
          <input 
            name="email" 
            type="email" 
            placeholder="Email" 
            required 
            style={{ padding: '8px' }}
          />
          <input 
            name="age" 
            type="number" 
            placeholder="Age (optional)" 
            style={{ padding: '8px' }}
          />
          <button 
            type="submit"
            style={{ 
              padding: '10px', 
              backgroundColor: '#3178C6', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create User
          </button>
        </Form>
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h3>Create Post</h3>
        <Form 
          action={createPost}
          onSuccess={(post) => {
            setPosts(prev => [post, ...prev]);
            console.log('Post created:', post);
          }}
          onError={(error) => {
            console.error('Error creating post:', error);
          }}
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px',
            maxWidth: '300px' 
          }}
        >
          <input 
            name="title" 
            placeholder="Post title" 
            required 
            style={{ padding: '8px' }}
          />
          <textarea 
            name="content" 
            placeholder="Post content" 
            required 
            rows={4}
            style={{ padding: '8px', fontFamily: 'inherit' }}
          />
          <input 
            name="authorId" 
            placeholder="Author ID" 
            required 
            style={{ padding: '8px' }}
          />
          <button 
            type="submit"
            style={{ 
              padding: '10px', 
              backgroundColor: '#3178C6', 
              color: 'white', 
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Create Post
          </button>
        </Form>
      </div>

      {users.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Recent Users</h3>
          {users.slice(0, 3).map(user => (
            <div key={user.id} style={{ 
              padding: '10px', 
              border: '1px solid #ddd', 
              marginBottom: '5px',
              borderRadius: '4px'
            }}>
              <strong>{user.name}</strong> - {user.email}
              {user.age && ` (Age: ${user.age})`}
            </div>
          ))}
        </div>
      )}

      {posts.length > 0 && (
        <div>
          <h3>Recent Posts</h3>
          {posts.slice(0, 3).map(post => (
            <div key={post.id} style={{ 
              padding: '10px', 
              border: '1px solid #ddd', 
              marginBottom: '5px',
              borderRadius: '4px'
            }}>
              <strong>{post.title}</strong>
              <p style={{ margin: '5px 0', color: '#666' }}>{post.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
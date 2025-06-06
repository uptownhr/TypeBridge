import React, { useState } from 'react';
import { UserList } from '../components/UserList';
import { PostList } from '../components/PostList';
import { FormDemo } from '../components/FormDemo';

export function App() {
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'forms'>('users');
  
  return (
    <div className="container">
      <h1>Seamless RPC Sample App</h1>
      <p>This app demonstrates seamless function calls between client and server using TypeScript.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setActiveTab('users')}
          style={{ 
            backgroundColor: activeTab === 'users' ? '#1976d2' : '#ccc',
            marginRight: '10px'
          }}
        >
          Users
        </button>
        <button 
          onClick={() => setActiveTab('posts')}
          style={{ 
            backgroundColor: activeTab === 'posts' ? '#1976d2' : '#ccc',
            marginRight: '10px'
          }}
        >
          Posts
        </button>
        <button 
          onClick={() => setActiveTab('forms')}
          style={{ 
            backgroundColor: activeTab === 'forms' ? '#1976d2' : '#ccc'
          }}
        >
          Form Demo
        </button>
      </div>
      
      {activeTab === 'users' && <UserList />}
      
      {activeTab === 'posts' && <PostList />}
      
      {activeTab === 'forms' && <FormDemo />}
      
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3>How it works:</h3>
        <ul>
          <li>Server functions in <code>src/server/api/</code> are automatically discovered</li>
          <li>Client components can import and call them directly with full type safety</li>
          <li>No manual API routes, no fetch calls, no serialization code needed</li>
          <li>All handled seamlessly by the RPC compiler and runtime</li>
        </ul>
        
        <h3>Development Features:</h3>
        <ul>
          <li>Hot reload for server function changes</li>
          <li>Detailed error messages with server stack traces</li>
          <li>RPC call logging and performance monitoring</li>
          <li>Full TypeScript support across client/server boundary</li>
        </ul>
      </div>
    </div>
  );
}
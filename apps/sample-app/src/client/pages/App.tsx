import React, { useState } from 'react';
import { UserProfile } from '../components/UserProfile';
import { PostList } from '../components/PostList';

export function App() {
  const [activeTab, setActiveTab] = useState<'users' | 'posts'>('users');
  const [selectedUserId, setSelectedUserId] = useState('user-1');
  
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
            backgroundColor: activeTab === 'posts' ? '#1976d2' : '#ccc'
          }}
        >
          Posts
        </button>
      </div>
      
      {activeTab === 'users' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <label>
              View User Profile:
              <select 
                value={selectedUserId} 
                onChange={(e) => setSelectedUserId(e.target.value)}
                style={{ marginLeft: '10px', padding: '5px' }}
              >
                <option value="user-1">User 1 (John Doe)</option>
                <option value="user-2">User 2 (Jane Smith)</option>
              </select>
            </label>
          </div>
          <UserProfile userId={selectedUserId} />
        </div>
      )}
      
      {activeTab === 'posts' && <PostList />}
      
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
import React, { useEffect, useState } from 'react';
import { getAllUsers, createUser, getUserProfile } from '../../server/api/users';
import { User } from '../../shared/types/user.js';

export function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<{
    user: User;
    stats: { postsCount: number; joinedDaysAgo: number };
  } | null>(null);
  
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setError(null);
        const usersData = await getAllUsers();
        setUsers(usersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUsers();
  }, []);
  
  const handleCreateUser = async () => {
    try {
      setError(null);
      
      const randomNum = Math.floor(Math.random() * 1000);
      const newUser = await createUser({
        name: `New User ${randomNum}`,
        email: `user${randomNum}@example.com`
      });
      
      setUsers(prev => [newUser, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };
  
  const handleViewUser = async (userId: string) => {
    try {
      setError(null);
      const userData = await getUserProfile(userId);
      setSelectedUser(userData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user profile');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading users...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2>Users ({users.length})</h2>
        <button onClick={handleCreateUser}>
          Create Random User
        </button>
      </div>
      
      {selectedUser && (
        <div className="user-card" style={{ marginBottom: '20px', backgroundColor: '#e8f5e8' }}>
          <h3>{selectedUser.user.name}</h3>
          <p><strong>Email:</strong> {selectedUser.user.email}</p>
          <p><strong>Joined:</strong> {new Date(selectedUser.user.createdAt).toLocaleDateString()} ({selectedUser.stats.joinedDaysAgo} days ago)</p>
          <p><strong>Posts:</strong> {selectedUser.stats.postsCount}</p>
          <button onClick={() => setSelectedUser(null)}>Close</button>
        </div>
      )}
      
      {users.length === 0 ? (
        <div>No users found</div>
      ) : (
        <div>
          {users.map(user => (
            <div key={user.id} className="user-card">
              <h3>{user.name}</h3>
              <p><strong>Email:</strong> {user.email}</p>
              <p><small>Joined: {new Date(user.createdAt).toLocaleDateString()}</small></p>
              <button onClick={() => handleViewUser(user.id)}>
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
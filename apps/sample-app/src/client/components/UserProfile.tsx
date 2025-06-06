import React, { useEffect, useState } from 'react';
import { getUserProfile, createUser } from '../../generated/client-stubs.js';
import { User } from '../../shared/types/user.js';

export function UserProfile({ userId }: { userId: string }) {
  const [profileData, setProfileData] = useState<{
    user: User;
    stats: { postsCount: number; joinedDaysAgo: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchUserProfile() {
      try {
        setLoading(true);
        setError(null);
        const data = await getUserProfile(userId);
        setProfileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUserProfile();
  }, [userId]);
  
  const handleCreateUser = async () => {
    try {
      setError(null);
      const newUser = await createUser({
        name: 'New User ' + Math.floor(Math.random() * 1000),
        email: `user${Math.floor(Math.random() * 1000)}@example.com`
      });
      
      // Refresh the profile data
      const data = await getUserProfile(newUser.id);
      setProfileData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };
  
  if (loading) {
    return <div className="loading">Loading user profile...</div>;
  }
  
  if (error) {
    return <div className="error">Error: {error}</div>;
  }
  
  if (!profileData) {
    return <div>User not found</div>;
  }
  
  const { user, stats } = profileData;
  
  return (
    <div className="user-card">
      <h2>{user.name}</h2>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()} ({stats.joinedDaysAgo} days ago)</p>
      <p><strong>Posts:</strong> {stats.postsCount}</p>
      
      <div style={{ marginTop: '15px' }}>
        <button onClick={handleCreateUser}>Create Random User</button>
      </div>
    </div>
  );
}
import { User, CreateUserData } from '../../shared/types/user.js';
import { db } from '../lib/database.js';

export async function getUser(id: string): Promise<User> {
  if (!id) {
    throw new Error('User ID is required');
  }
  
  const user = await db.findUser(id);
  if (!user) {
    throw new Error(`User with ID ${id} not found`);
  }
  
  return user;
}

export async function createUser(userData: CreateUserData): Promise<User> {
  if (!userData.name || !userData.email) {
    throw new Error('Name and email are required');
  }
  
  if (!userData.email.includes('@')) {
    throw new Error('Invalid email format');
  }
  
  return await db.createUser(userData);
}

export async function getAllUsers(): Promise<User[]> {
  return await db.getAllUsers();
}

export async function getUserProfile(id: string): Promise<{
  user: User;
  stats: {
    postsCount: number;
    joinedDaysAgo: number;
  };
}> {
  const user = await getUser(id);
  const posts = await db.getPostsByAuthor(id);
  const joinedDaysAgo = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    user,
    stats: {
      postsCount: posts.length,
      joinedDaysAgo
    }
  };
}
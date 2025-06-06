import { User, CreateUserData } from '../../shared/types/user.js';
import { Post, CreatePostData } from '../../shared/types/post.js';

// Mock database implementation
class MockDatabase {
  private users: Map<string, User> = new Map();
  private posts: Map<string, Post> = new Map();
  
  constructor() {
    // Seed some initial data
    this.seedData();
  }
  
  private seedData(): void {
    const user1: User = {
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      createdAt: new Date('2024-01-01')
    };
    
    const user2: User = {
      id: 'user-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      createdAt: new Date('2024-01-02')
    };
    
    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
    
    const post1: Post = {
      id: 'post-1',
      title: 'Welcome to Seamless RPC',
      content: 'This is a sample post demonstrating the seamless RPC system.',
      authorId: user1.id,
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03')
    };
    
    this.posts.set(post1.id, post1);
  }
  
  // User operations
  async findUser(id: string): Promise<User | null> {
    await this.simulateDelay();
    return this.users.get(id) || null;
  }
  
  async createUser(userData: CreateUserData): Promise<User> {
    await this.simulateDelay();
    
    const user: User = {
      id: this.generateId('user'),
      ...userData,
      createdAt: new Date()
    };
    
    this.users.set(user.id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    await this.simulateDelay();
    return Array.from(this.users.values());
  }
  
  // Post operations
  async findPost(id: string): Promise<Post | null> {
    await this.simulateDelay();
    return this.posts.get(id) || null;
  }
  
  async createPost(postData: CreatePostData): Promise<Post> {
    await this.simulateDelay();
    
    const post: Post = {
      id: this.generateId('post'),
      ...postData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.posts.set(post.id, post);
    return post;
  }
  
  async getPostsByAuthor(authorId: string): Promise<Post[]> {
    await this.simulateDelay();
    return Array.from(this.posts.values()).filter(post => post.authorId === authorId);
  }
  
  async getAllPosts(): Promise<Post[]> {
    await this.simulateDelay();
    return Array.from(this.posts.values());
  }
  
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private async simulateDelay(): Promise<void> {
    // Database operations are instant in this demo
    return;
  }
}

export const db = new MockDatabase();
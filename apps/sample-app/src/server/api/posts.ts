import { Post, CreatePostData } from '../../shared/types/post.js';
import { db } from '../lib/database.js';

export async function getPost(id: string): Promise<Post> {
  if (!id) {
    throw new Error('Post ID is required');
  }
  
  const post = await db.findPost(id);
  if (!post) {
    throw new Error(`Post with ID ${id} not found`);
  }
  
  return post;
}

export async function createPost(postData: CreatePostData): Promise<Post> {
  if (!postData.title || !postData.content || !postData.authorId) {
    throw new Error('Title, content, and author ID are required');
  }
  
  if (postData.title.length < 3) {
    throw new Error('Title must be at least 3 characters long');
  }
  
  if (postData.content.length < 10) {
    throw new Error('Content must be at least 10 characters long');
  }
  
  // Verify author exists
  const author = await db.findUser(postData.authorId);
  if (!author) {
    throw new Error('Author not found');
  }
  
  return await db.createPost(postData);
}

export async function getAllPosts(): Promise<Post[]> {
  return await db.getAllPosts();
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  if (!authorId) {
    throw new Error('Author ID is required');
  }
  
  return await db.getPostsByAuthor(authorId);
}

export async function getPostWithAuthor(id: string): Promise<{
  post: Post;
  author: {
    id: string;
    name: string;
    email: string;
  };
}> {
  const post = await getPost(id);
  const author = await db.findUser(post.authorId);
  
  if (!author) {
    throw new Error('Post author not found');
  }
  
  return {
    post,
    author: {
      id: author.id,
      name: author.name,
      email: author.email
    }
  };
}
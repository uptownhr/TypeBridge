export interface Post {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePostData {
  title: string;
  content: string;
  authorId: string;
}
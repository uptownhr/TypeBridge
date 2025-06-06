export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface CreateUserData {
  name: string;
  email: string;
}
import { rpcCall } from '@seamless-rpc/core';

export async function getUser(id) {
  return rpcCall('server/api/users.getUser', id);
}

export async function createUser(userData) {
  return rpcCall('server/api/users.createUser', userData);
}

export async function getAllUsers() {
  return rpcCall('server/api/users.getAllUsers');
}

export async function getUserProfile(id) {
  return rpcCall('server/api/users.getUserProfile', id);
}

export async function getPost(id) {
  return rpcCall('server/api/posts.getPost', id);
}

export async function createPost(postData) {
  return rpcCall('server/api/posts.createPost', postData);
}

export async function getAllPosts() {
  return rpcCall('server/api/posts.getAllPosts');
}

export async function getPostsByAuthor(authorId) {
  return rpcCall('server/api/posts.getPostsByAuthor', authorId);
}

export async function getPostWithAuthor(id) {
  return rpcCall('server/api/posts.getPostWithAuthor', id);
}
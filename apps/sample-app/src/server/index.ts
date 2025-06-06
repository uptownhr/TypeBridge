// Server entry point
// This file would be used for production builds
import { handleRPCRequest } from '@seamless-rpc/core';

// Import all server functions to register them
import './api/users.js';
import './api/posts.js';

console.log('Server functions loaded');

export { handleRPCRequest };
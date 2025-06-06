export interface AuthContext {
  userId?: string;
  isAuthenticated: boolean;
}

export async function validateAuth(token?: string): Promise<AuthContext> {
  // Mock authentication - in real app, validate JWT/session
  if (token === 'demo-token') {
    return {
      userId: 'user-1',
      isAuthenticated: true
    };
  }
  
  return {
    isAuthenticated: false
  };
}

export function requireAuth(context: AuthContext): void {
  if (!context.isAuthenticated) {
    throw new Error('Authentication required');
  }
}

export function getCurrentUserId(context: AuthContext): string {
  requireAuth(context);
  if (!context.userId) {
    throw new Error('User ID not found in context');
  }
  return context.userId;
}
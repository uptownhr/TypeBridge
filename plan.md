# Seamless RPC Implementation Plan

## Overview

Build a compile-time RPC system that allows seamless function calls between client and server code, making server functions callable as if they were local functions with full type safety.

## Project Structure

```
seamless-rpc/
├── packages/
│   ├── rpc-core/                 # Core RPC runtime & types
│   │   ├── src/
│   │   │   ├── types.ts          # Supported interfaces & error classes
│   │   │   ├── client.ts         # Client-side RPC runtime
│   │   │   ├── server.ts         # Server-side RPC handler
│   │   │   ├── serialization.ts  # Serialization/deserialization
│   │   │   └── index.ts          # Public exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── rpc-compiler/             # Build-time transformation
│   │   ├── src/
│   │   │   ├── plugin.ts         # Bun plugin implementation
│   │   │   ├── analyzer.ts       # AST analysis & function extraction
│   │   │   ├── generator.ts      # Code generation (stubs, routes)
│   │   │   └── index.ts          # Public exports
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── rpc-dev-tools/            # Development utilities
│       ├── src/
│       │   ├── dev-server.ts     # Development server with RPC
│       │   ├── logger.ts         # Development logging
│       │   └── index.ts          # Public exports
│       ├── package.json
│       └── tsconfig.json
├── apps/
│   └── sample-app/               # Example React application
│       ├── src/
│       │   ├── server/           # Server-only code
│       │   │   ├── api/
│       │   │   │   ├── users.ts
│       │   │   │   └── posts.ts
│       │   │   ├── lib/
│       │   │   │   ├── database.ts
│       │   │   │   └── auth.ts
│       │   │   └── index.ts
│       │   ├── client/           # Client-only code
│       │   │   ├── components/
│       │   │   │   ├── UserProfile.tsx
│       │   │   │   └── PostList.tsx
│       │   │   ├── pages/
│       │   │   │   └── App.tsx
│       │   │   └── index.tsx
│       │   ├── shared/           # Shared types & utilities
│       │   │   ├── types/
│       │   │   │   ├── user.ts
│       │   │   │   └── post.ts
│       │   │   └── utils/
│       │   └── generated/        # Auto-generated RPC code
│       │       ├── api-routes.ts
│       │       ├── client-stubs/
│       │       └── types.ts
│       ├── build/
│       │   └── rpc-config.ts     # RPC configuration
│       ├── public/
│       │   └── index.html
│       ├── package.json
│       ├── bunfig.toml
│       └── tsconfig.json
├── package.json                  # Root package.json for monorepo
├── bunfig.toml                   # Root Bun configuration
├── tsconfig.json                 # Root TypeScript configuration
└── README.md
```

## Supported Interfaces Standard

### Phase 1: Core Serializable Types

```typescript
// Primitive types
type RPCPrimitive = string | number | boolean | null;

// Supported complex types (Phase 1)
type RPCSerializable = 
  | RPCPrimitive
  | Date
  | Array<RPCSerializable>
  | { [key: string]: RPCSerializable };

// Function signature constraints
type RPCFunction = (...args: RPCSerializable[]) => Promise<RPCSerializable>;
```

### Phase 2: Extended Collections (Future)

```typescript
// Additional types to be supported in Phase 2
type RPCExtended = 
  | Map<string, RPCSerializable>
  | Set<RPCSerializable>
  | RPCSerializable;
```

### Phase 3: Advanced Types (Future)

```typescript
// Advanced types for Phase 3
type RPCAdvanced = 
  | BigInt
  | RegExp
  | RPCExtended;
```

## Standard RPC Error Class

```typescript
export class RPCError extends Error {
  public readonly name = 'RPCError';
  public readonly timestamp: Date;
  public readonly requestId?: string;
  
  constructor(
    message: string,
    public readonly code: RPCErrorCode,
    public readonly statusCode: number = 500,
    public readonly serverStack?: string,
    public readonly context?: Record<string, any>
  ) {
    super(message);
    this.timestamp = new Date();
    
    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RPCError);
    }
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
      context: this.context,
      ...(this.serverStack && { serverStack: this.serverStack })
    };
  }
}

export enum RPCErrorCode {
  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  
  // Server errors  
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  FUNCTION_NOT_FOUND = 'FUNCTION_NOT_FOUND',
  INVALID_ARGUMENTS = 'INVALID_ARGUMENTS',
  
  // Serialization errors
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  DESERIALIZATION_ERROR = 'DESERIALIZATION_ERROR',
  UNSUPPORTED_TYPE = 'UNSUPPORTED_TYPE',
  
  // Authentication/Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_PARAMETER = 'MISSING_PARAMETER'
}
```

## Implementation Tasks

### Task 1: Create Core RPC Package

**packages/rpc-core/package.json**
```json
{
  "name": "@seamless-rpc/core",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./client": "./dist/client.js",
    "./server": "./dist/server.js",
    "./types": "./dist/types.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target node",
    "dev": "bun build ./src/index.ts --outdir ./dist --target node --watch",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/bun": "latest"
  }
}
```

**Implementation Files:**
- `types.ts` - Core interfaces, RPCError class, supported type definitions
- `client.ts` - Client-side RPC runtime with fetch wrapper, error handling, serialization
- `server.ts` - Server-side RPC handler, function registry, request processing
- `serialization.ts` - Type-specific serialization/deserialization handlers

### Task 2: Create Compiler Package

**packages/rpc-compiler/package.json**
```json
{
  "name": "@seamless-rpc/compiler",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./plugin": "./dist/plugin.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target node",
    "dev": "bun build ./src/index.ts --outdir ./dist --target node --watch"
  },
  "dependencies": {
    "typescript": "^5.0.0"
  },
  "peerDependencies": {
    "bun": "*"
  }
}
```

**Implementation Files:**
- `plugin.ts` - Main Bun plugin with onResolve/onLoad handlers
- `analyzer.ts` - TypeScript AST analysis, function extraction, dependency graphing
- `generator.ts` - Client stub generation, API route generation, type generation

### Task 3: Create Dev Tools Package

**packages/rpc-dev-tools/package.json**
```json
{
  "name": "@seamless-rpc/dev-tools",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    ".": "./dist/index.js",
    "./dev-server": "./dist/dev-server.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target node",
    "dev": "bun build ./src/index.ts --outdir ./dist --target node --watch"
  },
  "dependencies": {
    "@seamless-rpc/core": "workspace:*"
  }
}
```

**Implementation Files:**
- `dev-server.ts` - Development server with hot reload, RPC endpoint handling
- `logger.ts` - Development logging, RPC call tracing, performance monitoring

### Task 4: Create Sample React Application

**apps/sample-app/package.json**
```json
{
  "name": "sample-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun run build/dev-server.ts",
    "build": "bun build ./src/client/index.tsx --outdir ./dist/client --target browser",
    "build:server": "bun build ./src/server/index.ts --outdir ./dist/server --target node",
    "start": "bun run ./dist/server/index.js",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@seamless-rpc/core": "workspace:*"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@seamless-rpc/compiler": "workspace:*",
    "@seamless-rpc/dev-tools": "workspace:*",
    "typescript": "^5.0.0"
  }
}
```

**apps/sample-app/bunfig.toml**
```toml
[build]
plugins = ["./build/rpc-config.ts"]
target = "browser"

[dev]
hot = true
port = 3000

[install]
exact = true
```

**Example Server Functions:**
```typescript
// apps/sample-app/src/server/api/users.ts
export async function getUser(id: string): Promise<User> {
  // Simulate database call
  await new Promise(resolve => setTimeout(resolve, 100));
  return {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    createdAt: new Date()
  };
}

export async function createUser(userData: CreateUserData): Promise<User> {
  // Simulate user creation
  const user: User = {
    id: Math.random().toString(36).substr(2, 9),
    ...userData,
    createdAt: new Date()
  };
  return user;
}
```

**Example React Components:**
```typescript
// apps/sample-app/src/client/components/UserProfile.tsx
import React, { useEffect, useState } from 'react';
import { getUser, createUser } from '@/server/api/users'; // Magic import

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const userData = await getUser(userId); // Seamless RPC call
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    
    fetchUser();
  }, [userId]);
  
  const handleCreateUser = async () => {
    try {
      const newUser = await createUser({ // Another seamless RPC call
        name: 'New User',
        email: 'new@example.com'
      });
      setUser(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;
  
  return (
    <div>
      <h1>{user.name}</h1>
      <p>Email: {user.email}</p>
      <p>Created: {user.createdAt.toLocaleDateString()}</p>
      <button onClick={handleCreateUser}>Create Another User</button>
    </div>
  );
}
```

## Development Commands

### Initial Setup

```bash
# Clone and setup monorepo
git clone <repo-url>
cd seamless-rpc

# Install dependencies
bun install

# Build all packages
bun run build:all

# Run sample application
cd apps/sample-app
bun run dev
```

### Development Workflow

```bash
# Start development mode with hot reload
bun run dev

# Build packages in watch mode
bun run dev:packages

# Type checking across all packages
bun run type-check:all

# Run tests
bun run test:all
```

### Package-Specific Commands

```bash
# Core package development
cd packages/rpc-core
bun run dev

# Compiler package development  
cd packages/rpc-compiler
bun run dev

# Sample app development
cd apps/sample-app
bun run dev
```

## Key Implementation Features

### 1. Compile-Time Safety
- Validate all server function signatures at build time
- Ensure only supported types are used in RPC functions
- Generate TypeScript errors for unsupported patterns

### 2. Development Experience
- Hot reload for server function changes
- Clear error messages with server stack traces
- Visual indicators for RPC calls in development
- Auto-completion and IntelliSense support

### 3. Production Optimization
- Tree-shaking for unused server functions
- Optimized client bundle sizes
- Efficient serialization/deserialization
- Request deduplication and caching

### 4. Error Handling
- Comprehensive error classification
- Retry logic with exponential backoff
- Network failure recovery
- Detailed error context for debugging

### 5. Type Safety
- Full TypeScript support across client/server boundary
- Preserved function signatures in generated stubs
- Compile-time validation of parameter types
- Runtime type checking in development mode

## Success Criteria

1. **Zero Ceremony**: Import server functions and call them like local functions
2. **Full Type Safety**: Complete TypeScript support with no type loss
3. **Fast Builds**: Sub-second rebuild times with Bun
4. **Great DX**: Clear errors, hot reload, debugging support
5. **Production Ready**: Optimized bundles, robust error handling
6. **Framework Agnostic**: Works with React, Vue, Svelte, Angular
7. **Backwards Compatible**: Can be added to existing projects incrementally

## Getting Started Guide

After implementation, users should be able to:

1. Run `bun create seamless-rpc my-app`
2. Write server functions in `src/server/`
3. Import and call them from client code
4. Run `bun run dev` and everything works
5. Deploy with `bun run build && bun run start`

The entire setup should take less than 5 minutes and require zero configuration for the basic use case.
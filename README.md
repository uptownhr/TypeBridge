<div align="center">

![TypeBridge Logo](./logo.svg)

# TypeBridge

</div>

A compile-time RPC system for TypeScript that allows seamless function calls between client and server code with full type safety.

TypeBridge transforms server imports into RPC calls at build time, eliminating boilerplate while preserving complete TypeScript type information across the client-server boundary.

## Why TypeBridge?

### vs tRPC

**❌ tRPC Server Definition:**
```typescript
// tRPC requires procedures and routers
const userRouter = t.router({
  getUser: t.procedure
    .input(z.string())
    .query(async ({ input }) => {
      return await db.findUser(input);
    }),
  
  createUser: t.procedure
    .input(z.object({ name: z.string(), email: z.string() }))
    .mutation(async ({ input }) => {
      return await db.createUser(input);
    })
});

export const appRouter = t.router({
  user: userRouter,
});
```

**❌ tRPC Client Usage:**
```typescript
// Complex API with hooks and query keys
const user = trpc.user.getUser.useQuery('user-123');
const createUserMutation = trpc.user.createUser.useMutation();
```

**✅ TypeBridge Server Definition:**
```typescript
// Just regular TypeScript functions
export async function getUser(id: string): Promise<User> {
  return await db.findUser(id);
}

export async function createUser(userData: CreateUserData): Promise<User> {
  return await db.createUser(userData);
}
```

**✅ TypeBridge Client Usage:**
```typescript
// Direct imports and function calls
import { getUser, createUser } from '../../server/api/users';

const user = await getUser('user-123');
const newUser = await createUser({ name: 'John', email: 'john@example.com' });
```

### vs React Server Actions

**❌ React Server Actions Oddities:**

```typescript
// Server Action requires 'use server' directive
async function createUser(formData: FormData) {
  'use server';
  
  // Awkward FormData parsing
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  
  return await db.createUser({ name, email });
}

// Client: Form-specific, limited to form submissions
<form action={createUser}>
  <input name="name" />
  <input name="email" />
  <button type="submit">Create</button>
</form>

// For non-form usage, needs binding
const boundAction = createUser.bind(null, userData);
```

**✅ TypeBridge Approach:**
```typescript
// Server: Regular function
export async function createUser(userData: CreateUserData): Promise<User> {
  return await db.createUser(userData);
}

// Client: Clean form with automatic data conversion
import { Form } from '@seamless-rpc/core';
import { createUser } from '../../server/api/users';

<Form action={createUser}>
  <input name="name" />
  <input name="email" />
  <button type="submit">Create</button>
</Form>

// Also works in event handlers, useEffect, anywhere
const handleClick = async () => {
  const user = await createUser(userData);
};
```

## Key Advantages

- **🎯 Zero Learning Curve**: Write server functions, import them in client code - that's it
- **⚡ Natural TypeScript**: No schemas, procedures, or directives - just functions
- **🚀 Universal Usage**: Call server functions anywhere, not just forms or hooks
- **📦 Minimal Overhead**: No runtime libraries, just optimized RPC calls
- **🔧 Any Framework**: Works with React, Vue, Svelte, vanilla JS
- **🎨 True Imports**: Real ES6 imports that your IDE understands completely
- **📝 Smart Forms**: Automatic FormData to object conversion with full type safety

## Features

- **Zero Ceremony**: Import server functions and call them like local functions
- **Full Type Safety**: Complete TypeScript support with no type loss
- **Smart Forms**: TypeBridge `<Form>` component with automatic data conversion
- **Fast Builds**: Sub-second rebuild times with Bun
- **Great DX**: Clear errors, hot reload, debugging support
- **Production Ready**: Optimized bundles, robust error handling
- **Framework Agnostic**: Works with React, Vue, Svelte, Angular

## Quick Start

```bash
# Install dependencies
bun install

# Build all packages
bun run build:all

# Run the sample application
bun run dev
```

The sample app will be available at http://localhost:3000

## How It Works

### 1. Write Server Functions

```typescript
// apps/sample-app/src/server/api/users.ts
export async function getUser(id: string): Promise<User> {
  return await db.findUser(id);
}

export async function createUser(userData: CreateUserData): Promise<User> {
  return await db.createUser(userData);
}
```

### 2. Call From Client Code

```typescript
// apps/sample-app/src/client/components/UserProfile.tsx
import { getUser, createUser } from '@/server/api/users'; // Magic import!

export function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    async function fetchUser() {
      const userData = await getUser(userId); // Seamless RPC call
      setUser(userData);
    }
    fetchUser();
  }, [userId]);
  
  // ... rest of component
}
```

### 3. Everything Just Works

- Full TypeScript IntelliSense and type checking
- Automatic serialization/deserialization
- Error handling with server stack traces
- Hot reload when server functions change
- No manual API routes or fetch calls needed

### File Uploads - Limitation & Recommended Solution

**Current Limitation:** TypeBridge Form component doesn't automatically handle file uploads through RPC calls, as files cannot be JSON serialized across the network boundary.

**Recommended Solution:** Use dedicated file upload services for clean architecture:

```typescript
// Recommended approach using Uppy or Filestack
import { Uppy } from '@uppy/core';
import { createUser } from '../../server/api/users';

const uppy = new Uppy({
  restrictions: { maxFileSize: 5000000 } // 5MB
});

export function UserForm() {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');

  useEffect(() => {
    uppy.on('upload-success', (file, response) => {
      setUploadedFileUrl(response.uploadURL);
    });
  }, []);

  return (
    <Form action={createUser}>
      <input name="name" />
      <input name="email" />
      <input 
        name="avatarUrl" 
        type="hidden" 
        value={uploadedFileUrl} 
      />
      
      {/* File upload handled separately */}
      <div id="uppy-upload"></div>
      
      <button type="submit" disabled={!uploadedFileUrl}>
        Create User
      </button>
    </Form>
  );
}

// Server function receives clean URL
export async function createUser(data: { 
  name: string; 
  email: string; 
  avatarUrl: string; // Just a URL string
}) {
  return await db.createUser(data);
}
```

**Why this approach works better:**
- **Separation of concerns**: File handling separate from business logic
- **Performance**: Files upload independently, no blocking RPC calls
- **Reliability**: Dedicated services handle retries, chunking, progress
- **Security**: Upload services handle validation, virus scanning
- **Scalability**: CDN integration, global upload endpoints

**Recommended Services:**
- **[Uppy](https://uppy.io/)** - Open source, highly customizable
- **[Filestack](https://www.filestack.com/)** - Commercial with advanced features  
- **[Cloudinary](https://cloudinary.com/)** - Image/video focused with transformations

## Error Handling

The system provides comprehensive error handling:

```typescript
try {
  const user = await getUser('invalid-id');
} catch (error) {
  if (error instanceof RPCError) {
    console.log(error.code);        // Error classification
    console.log(error.statusCode);  // HTTP status
    console.log(error.serverStack); // Server stack trace
  }
}
```

## Supported Types

### Phase 1 (Current)
- Primitives: `string`, `number`, `boolean`, `null`
- `Date` objects
- Arrays and plain objects
- Nested combinations of the above

### Future Phases
- Collections: `Map`, `Set`
- Advanced types: `BigInt`, `RegExp`
- Custom serializable classes

## Project Structure

```
TypeBridge/
├── packages/
│   ├── rpc-core/           # Core RPC runtime & types
│   ├── rpc-compiler/       # Build-time transformation
│   └── rpc-dev-tools/      # Development utilities
├── apps/
│   └── sample-app/         # Example React application
│       ├── src/
│       │   ├── client/     # React frontend code
│       │   │   ├── components/
│       │   │   ├── pages/
│       │   │   └── index.tsx
│       │   ├── server/     # Backend API functions
│       │   │   └── api/
│       │   │       ├── users.ts
│       │   │       └── posts.ts
│       │   └── shared/     # Shared types & utilities
│       │       └── types/
│       ├── build/          # Development server scripts
│       └── vite.config.ts  # Vite configuration
├── package.json            # Root package.json for monorepo
└── README.md
```

## Packages

### @seamless-rpc/core

Core runtime library providing:
- RPC client for making function calls
- RPC server for handling requests
- Serialization/deserialization
- Error handling and types

### @seamless-rpc/compiler

Build-time compiler providing:
- Bun plugin for code transformation
- TypeScript AST analysis
- Client stub generation
- Server route registration

### @seamless-rpc/dev-tools

Development utilities providing:
- Development server with hot reload
- RPC call logging and debugging
- Performance monitoring

## Development

```bash
# Install dependencies
bun install

# Build all packages in development mode
bun run dev:packages

# Run type checking across all packages
bun run type-check:all

# Clean all build artifacts
bun run clean
```

## Supported Types

### Phase 1 (Current)
- Primitives: `string`, `number`, `boolean`, `null`
- `Date` objects
- Arrays and plain objects
- Nested combinations of the above

### Future Phases
- Collections: `Map`, `Set`
- Advanced types: `BigInt`, `RegExp`
- Custom serializable classes

## Development Features

- **Client HMR**: React components update instantly with Vite Fast Refresh
- **Server Hot Reload**: Server function changes automatically restart backend
- **Detailed Errors**: Full server stack traces in development
- **Call Logging**: All RPC calls are logged with timing information
- **Type Safety**: Compile-time validation of function signatures

## Production Optimization

- **Tree Shaking**: Unused server functions are removed from client bundles
- **Optimized Serialization**: Efficient JSON serialization with Date handling
- **Request Deduplication**: Automatic deduplication of identical requests
- **Retry Logic**: Exponential backoff for network failures

## License

MIT
# TypeBridge

**The ultimate TypeScript-first RPC framework that makes remote calls feel local.**

TypeBridge eliminates the gap between client and server by letting you import and call server functions as if they were local - with complete type safety, zero boilerplate, and magical developer experience. Write `import { getUser } from '../../server/api/users'` in your React component and watch TypeBridge transform it into optimized RPC calls at build time, preserving every type, parameter, and return value along the way.

## Features

- **Zero Ceremony**: Import server functions and call them like local functions
- **Full Type Safety**: Complete TypeScript support with no type loss
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

## Project Structure

```
TypeBridge/
├── packages/
│   ├── rpc-core/           # Core RPC runtime & types
│   ├── rpc-compiler/       # Build-time transformation
│   └── rpc-dev-tools/      # Development utilities
├── apps/
│   └── sample-app/         # Example React application
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

## Development Features

- **Hot Reload**: Server function changes automatically trigger client rebuilds
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
import { FunctionRegistry, RPCRequest, RPCResponse, RPCError, RPCErrorCode, RPCFunction } from './types.js';
import { serialize, deserialize, validateSerializable } from './serialization.js';

export class RPCServer {
  private functions: FunctionRegistry = {};
  
  register(name: string, fn: RPCFunction): void {
    this.functions[name] = fn;
  }
  
  unregister(name: string): void {
    delete this.functions[name];
  }
  
  async handle(requestBody: string): Promise<string> {
    let request: RPCRequest;
    
    try {
      request = deserialize(requestBody) as RPCRequest;
    } catch (error) {
      const response: RPCResponse = {
        id: 'unknown',
        error: {
          code: RPCErrorCode.DESERIALIZATION_ERROR,
          message: 'Invalid request format',
          statusCode: 400
        },
        timestamp: Date.now()
      };
      return serialize(response);
    }
    
    if (!this.isValidRequest(request)) {
      const response: RPCResponse = {
        id: request.id || 'unknown',
        error: {
          code: RPCErrorCode.INVALID_ARGUMENTS,
          message: 'Invalid request structure',
          statusCode: 400
        },
        timestamp: Date.now()
      };
      return serialize(response);
    }
    
    const fn = this.functions[request.method];
    if (!fn) {
      const response: RPCResponse = {
        id: request.id,
        error: {
          code: RPCErrorCode.FUNCTION_NOT_FOUND,
          message: `Function '${request.method}' not found`,
          statusCode: 404
        },
        timestamp: Date.now()
      };
      return serialize(response);
    }
    
    try {
      if (!request.params.every(validateSerializable)) {
        throw new RPCError(
          'Invalid parameter types',
          RPCErrorCode.UNSUPPORTED_TYPE,
          400
        );
      }
      
      const result = await fn(...request.params);
      
      if (!validateSerializable(result)) {
        throw new RPCError(
          'Function returned non-serializable value',
          RPCErrorCode.SERIALIZATION_ERROR,
          500
        );
      }
      
      const response: RPCResponse = {
        id: request.id,
        result,
        timestamp: Date.now()
      };
      
      return serialize(response);
    } catch (error) {
      let rpcError: RPCError;
      
      if (error instanceof RPCError) {
        rpcError = error;
      } else {
        rpcError = new RPCError(
          error instanceof Error ? error.message : 'Unknown error',
          RPCErrorCode.INTERNAL_SERVER_ERROR,
          500,
          error instanceof Error ? error.stack : undefined
        );
      }
      
      const response: RPCResponse = {
        id: request.id,
        error: {
          code: rpcError.code,
          message: rpcError.message,
          statusCode: rpcError.statusCode,
          serverStack: rpcError.serverStack,
          context: rpcError.context
        },
        timestamp: Date.now()
      };
      
      return serialize(response);
    }
  }
  
  private isValidRequest(obj: any): obj is RPCRequest {
    return obj &&
           typeof obj.id === 'string' &&
           typeof obj.method === 'string' &&
           Array.isArray(obj.params) &&
           typeof obj.timestamp === 'number';
  }
  
  getFunctions(): string[] {
    return Object.keys(this.functions);
  }
}

let defaultServer: RPCServer | null = null;

export function createRPCServer(): RPCServer {
  return new RPCServer();
}

export function getDefaultServer(): RPCServer {
  if (!defaultServer) {
    defaultServer = new RPCServer();
  }
  return defaultServer;
}

export function registerFunction(name: string, fn: RPCFunction): void {
  getDefaultServer().register(name, fn);
}

export function unregisterFunction(name: string): void {
  getDefaultServer().unregister(name);
}

export async function handleRPCRequest(requestBody: string): Promise<string> {
  return getDefaultServer().handle(requestBody);
}
export type RPCPrimitive = string | number | boolean | null;

export type RPCSerializable = 
  | RPCPrimitive
  | Date
  | Array<RPCSerializable>
  | { [key: string]: RPCSerializable };

export type RPCFunction = (...args: RPCSerializable[]) => Promise<RPCSerializable>;

export enum RPCErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  FUNCTION_NOT_FOUND = 'FUNCTION_NOT_FOUND',
  INVALID_ARGUMENTS = 'INVALID_ARGUMENTS',
  
  SERIALIZATION_ERROR = 'SERIALIZATION_ERROR',
  DESERIALIZATION_ERROR = 'DESERIALIZATION_ERROR',
  UNSUPPORTED_TYPE = 'UNSUPPORTED_TYPE',
  
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_PARAMETER = 'MISSING_PARAMETER'
}

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

export interface RPCRequest {
  id: string;
  method: string;
  params: RPCSerializable[];
  timestamp: number;
}

export interface RPCResponse {
  id: string;
  result?: RPCSerializable;
  error?: {
    code: RPCErrorCode;
    message: string;
    statusCode: number;
    serverStack?: string;
    context?: Record<string, any>;
  };
  timestamp: number;
}

export interface RPCClientOptions {
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
}

export interface FunctionRegistry {
  [key: string]: RPCFunction;
}
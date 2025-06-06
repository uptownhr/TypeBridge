import { RPCClientOptions, RPCRequest, RPCResponse, RPCError, RPCErrorCode, RPCSerializable } from './types.js';
import { serialize, deserialize } from './serialization.js';

export class RPCClient {
  private baseUrl: string;
  private timeout: number;
  private retryAttempts: number;
  private retryDelay: number;
  private headers: Record<string, string>;
  
  constructor(options: RPCClientOptions = {}) {
    this.baseUrl = options.baseUrl || '/api/rpc';
    this.timeout = options.timeout || 30000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.headers = options.headers || {};
  }
  
  async call(method: string, ...params: RPCSerializable[]): Promise<RPCSerializable> {
    const requestId = this.generateRequestId();
    const request: RPCRequest = {
      id: requestId,
      method,
      params,
      timestamp: Date.now()
    };
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await this.makeRequest(request);
        
        if (response.error) {
          throw new RPCError(
            response.error.message,
            response.error.code,
            response.error.statusCode,
            response.error.serverStack,
            response.error.context
          );
        }
        
        return response.result!;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.retryAttempts && this.shouldRetry(error)) {
          await this.delay(this.retryDelay * Math.pow(2, attempt));
          continue;
        }
        
        break;
      }
    }
    
    throw lastError || new RPCError(
      'Unknown error occurred',
      RPCErrorCode.INTERNAL_SERVER_ERROR
    );
  }
  
  private async makeRequest(request: RPCRequest): Promise<RPCResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.headers
        },
        body: serialize(request),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new RPCError(
          `HTTP ${response.status}: ${response.statusText}`,
          RPCErrorCode.NETWORK_ERROR,
          response.status
        );
      }
      
      const responseText = await response.text();
      return deserialize(responseText) as RPCResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof RPCError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new RPCError(
          'Request timeout',
          RPCErrorCode.TIMEOUT,
          408
        );
      }
      
      throw new RPCError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        RPCErrorCode.CONNECTION_FAILED,
        0
      );
    }
  }
  
  private shouldRetry(error: any): boolean {
    if (error instanceof RPCError) {
      return error.code === RPCErrorCode.NETWORK_ERROR || 
             error.code === RPCErrorCode.TIMEOUT ||
             error.code === RPCErrorCode.CONNECTION_FAILED;
    }
    return false;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

let defaultClient: RPCClient | null = null;

export function createRPCClient(options?: RPCClientOptions): RPCClient {
  return new RPCClient(options);
}

export function setDefaultClient(client: RPCClient): void {
  defaultClient = client;
}

export function getDefaultClient(): RPCClient {
  if (!defaultClient) {
    defaultClient = new RPCClient();
  }
  return defaultClient;
}

export async function rpcCall(method: string, ...params: RPCSerializable[]): Promise<RPCSerializable> {
  return getDefaultClient().call(method, ...params);
}
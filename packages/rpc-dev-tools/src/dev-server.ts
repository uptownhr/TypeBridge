import { handleRPCRequest } from '@seamless-rpc/core';
import { getLogger } from './logger.js';
import * as path from 'path';
import * as fs from 'fs';

export interface DevServerOptions {
  port?: number;
  host?: string;
  rpcEndpoint?: string;
  staticDir?: string;
  hotReload?: boolean;
  cors?: boolean;
}

export class RPCDevServer {
  private port: number;
  private host: string;
  private rpcEndpoint: string;
  private staticDir: string;
  private hotReload: boolean;
  private cors: boolean;
  private logger = getLogger();
  
  constructor(options: DevServerOptions = {}) {
    this.port = options.port || 3000;
    this.host = options.host || 'localhost';
    this.rpcEndpoint = options.rpcEndpoint || '/api/rpc';
    this.staticDir = options.staticDir || 'public';
    this.hotReload = options.hotReload ?? true;
    this.cors = options.cors ?? true;
  }
  
  async start(): Promise<void> {
    const server = Bun.serve({
      port: this.port,
      hostname: this.host,
      
      fetch: async (request: Request): Promise<Response> => {
        const url = new URL(request.url);
        
        // Handle CORS preflight
        if (this.cors && request.method === 'OPTIONS') {
          return new Response(null, {
            status: 204,
            headers: this.getCORSHeaders()
          });
        }
        
        // Handle RPC requests
        if (url.pathname === this.rpcEndpoint && request.method === 'POST') {
          return this.handleRPC(request);
        }
        
        // Handle development endpoints
        if (url.pathname === '/dev/rpc/logs') {
          return this.handleDevLogs(request);
        }
        
        if (url.pathname === '/dev/rpc/stats') {
          return this.handleDevStats(request);
        }
        
        // Serve static files
        return this.serveStatic(url.pathname);
      }
    });
    
    console.log(`🚀 RPC Dev Server running at http://${this.host}:${this.port}`);
    console.log(`📡 RPC endpoint: ${this.rpcEndpoint}`);
    console.log(`📁 Static files: ${this.staticDir}`);
    
    if (this.hotReload) {
      console.log(`🔥 Hot reload enabled`);
    }
  }
  
  private async handleRPC(request: Request): Promise<Response> {
    const requestId = this.generateRequestId();
    
    try {
      const body = await request.text();
      const rpcRequest = JSON.parse(body);
      
      this.logger.logRequest(requestId, rpcRequest.method, rpcRequest.params);
      
      const response = await handleRPCRequest(body);
      const responseData = JSON.parse(response);
      
      if (responseData.error) {
        this.logger.logResponse(requestId, undefined, responseData.error.message);
      } else {
        this.logger.logResponse(requestId, responseData.result);
      }
      
      return new Response(response, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCORSHeaders()
        }
      });
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.logResponse(requestId, undefined, errorMessage);
      
      return new Response(JSON.stringify({
        id: requestId,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
          statusCode: 500
        }
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...this.getCORSHeaders()
        }
      });
    }
  }
  
  private async handleDevLogs(request: Request): Promise<Response> {
    const logs = this.logger.getLogs();
    return new Response(JSON.stringify(logs, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...this.getCORSHeaders()
      }
    });
  }
  
  private async handleDevStats(request: Request): Promise<Response> {
    const stats = this.logger.getStats();
    return new Response(JSON.stringify(stats, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...this.getCORSHeaders()
      }
    });
  }
  
  private async serveStatic(pathname: string): Promise<Response> {
    let filePath: string;
    
    if (pathname === '/') {
      filePath = path.join(this.staticDir, 'index.html');
    } else {
      filePath = path.join(this.staticDir, pathname);
    }
    
    try {
      const file = Bun.file(filePath);
      const exists = await file.exists();
      
      if (!exists) {
        // Try serving from dist directory (for built assets)
        if (pathname.startsWith('/dist/')) {
          const distPath = pathname.substring(1); // Remove leading slash
          const distFile = Bun.file(distPath);
          const distExists = await distFile.exists();
          
          if (distExists) {
            const contentType = this.getContentType(distPath);
            return new Response(distFile, {
              headers: {
                'Content-Type': contentType,
                ...this.getCORSHeaders()
              }
            });
          }
        }
        
        // Try serving index.html for SPA routing
        const indexPath = path.join(this.staticDir, 'index.html');
        const indexFile = Bun.file(indexPath);
        const indexExists = await indexFile.exists();
        
        if (indexExists) {
          return new Response(indexFile, {
            headers: {
              'Content-Type': 'text/html',
              ...this.getCORSHeaders()
            }
          });
        }
        
        return new Response('Not Found', { status: 404 });
      }
      
      const contentType = this.getContentType(filePath);
      return new Response(file, {
        headers: {
          'Content-Type': contentType,
          ...this.getCORSHeaders()
        }
      });
      
    } catch (error) {
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  
  private getCORSHeaders(): Record<string, string> {
    if (!this.cors) return {};
    
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };
  }
  
  private getContentType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
  
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export function createDevServer(options?: DevServerOptions): RPCDevServer {
  return new RPCDevServer(options);
}

export async function startDevServer(options?: DevServerOptions): Promise<void> {
  const server = createDevServer(options);
  await server.start();
}
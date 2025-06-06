export interface RPCLogEntry {
  id: string;
  method: string;
  params: any[];
  timestamp: number;
  duration?: number;
  success: boolean;
  error?: string;
  result?: any;
}

export class RPCLogger {
  private logs: RPCLogEntry[] = [];
  private maxLogs = 1000;
  
  logRequest(id: string, method: string, params: any[]): void {
    const entry: RPCLogEntry = {
      id,
      method,
      params,
      timestamp: Date.now(),
      success: false
    };
    
    this.addLog(entry);
    this.printRequest(entry);
  }
  
  logResponse(id: string, result?: any, error?: string): void {
    const entry = this.logs.find(log => log.id === id);
    if (entry) {
      entry.duration = Date.now() - entry.timestamp;
      entry.success = !error;
      entry.result = result;
      entry.error = error;
      
      this.printResponse(entry);
    }
  }
  
  private addLog(entry: RPCLogEntry): void {
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
  }
  
  private printRequest(entry: RPCLogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    console.log(`\n📡 [${timestamp}] RPC Call: ${entry.method}`);
    console.log(`   ID: ${entry.id}`);
    if (entry.params.length > 0) {
      console.log(`   Params:`, entry.params);
    }
  }
  
  private printResponse(entry: RPCLogEntry): void {
    const status = entry.success ? '✅' : '❌';
    const duration = entry.duration ? `${entry.duration}ms` : 'unknown';
    
    console.log(`${status} [${duration}] ${entry.method} ${entry.success ? 'completed' : 'failed'}`);
    
    if (entry.error) {
      console.log(`   Error: ${entry.error}`);
    } else if (entry.result !== undefined) {
      console.log(`   Result:`, entry.result);
    }
  }
  
  getLogs(): RPCLogEntry[] {
    return [...this.logs];
  }
  
  getStats(): {
    total: number;
    successful: number;
    failed: number;
    averageDuration: number;
  } {
    const completed = this.logs.filter(log => log.duration !== undefined);
    const successful = completed.filter(log => log.success);
    const failed = completed.filter(log => !log.success);
    
    const totalDuration = completed.reduce((sum, log) => sum + (log.duration || 0), 0);
    const averageDuration = completed.length > 0 ? Math.round(totalDuration / completed.length) : 0;
    
    return {
      total: completed.length,
      successful: successful.length,
      failed: failed.length,
      averageDuration
    };
  }
  
  clear(): void {
    this.logs = [];
    console.log('🧹 RPC logs cleared');
  }
  
  printStats(): void {
    const stats = this.getStats();
    console.log('\n📊 RPC Statistics:');
    console.log(`   Total calls: ${stats.total}`);
    console.log(`   Successful: ${stats.successful} (${Math.round(stats.successful / stats.total * 100)}%)`);
    console.log(`   Failed: ${stats.failed} (${Math.round(stats.failed / stats.total * 100)}%)`);
    console.log(`   Average duration: ${stats.averageDuration}ms`);
  }
}

let defaultLogger: RPCLogger | null = null;

export function getLogger(): RPCLogger {
  if (!defaultLogger) {
    defaultLogger = new RPCLogger();
  }
  return defaultLogger;
}

export function createLogger(): RPCLogger {
  return new RPCLogger();
}
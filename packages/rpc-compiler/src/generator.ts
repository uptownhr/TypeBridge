import { RPCFunction } from './analyzer.js';
import * as path from 'path';

export interface GeneratorOptions {
  outputDir: string;
  serverDir: string;
  clientDir: string;
}

export class CodeGenerator {
  constructor(private options: GeneratorOptions) {}
  
  generateClientStubs(functions: RPCFunction[]): string {
    const imports = this.generateImports();
    const stubs = functions.map(func => this.generateClientStub(func)).join('\n\n');
    
    return `${imports}\n\n${stubs}`;
  }
  
  private generateImports(): string {
    return `import { rpcCall } from '@seamless-rpc/core';`;
  }
  
  private generateClientStub(func: RPCFunction): string {
    const paramsList = func.parameters.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ');
    const argsCall = func.parameters.map(p => p.name).join(', ');
    const returnType = this.extractReturnType(func.returnType);
    
    return `export async function ${func.name}(${paramsList}): Promise<${returnType}> {
  return rpcCall('${this.generateFunctionKey(func)}'${argsCall ? `, ${argsCall}` : ''}) as Promise<${returnType}>;
}`;
  }
  
  private extractReturnType(returnType: string): string {
    const promiseMatch = returnType.match(/Promise<(.+)>/);
    return promiseMatch ? promiseMatch[1] : 'any';
  }
  
  private generateFunctionKey(func: RPCFunction): string {
    const relativePath = path.relative(this.options.serverDir, func.filePath);
    const modulePath = relativePath.replace(/\.ts$/, '').replace(/\\/g, '/');
    return `${modulePath}.${func.name}`;
  }
  
  generateServerRoutes(functions: RPCFunction[]): string {
    const imports = this.generateServerImports(functions);
    const registrations = functions.map(func => this.generateServerRegistration(func)).join('\n');
    
    return `${imports}\n\nimport { registerFunction } from '@seamless-rpc/core';\n\n${registrations}`;
  }
  
  private generateServerImports(functions: RPCFunction[]): string {
    const imports = new Map<string, Set<string>>();
    
    for (const func of functions) {
      const relativePath = path.relative(this.options.outputDir, func.filePath).replace(/\.ts$/, '.js');
      const importPath = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      
      if (!imports.has(importPath)) {
        imports.set(importPath, new Set());
      }
      imports.get(importPath)!.add(func.name);
    }
    
    return Array.from(imports.entries())
      .map(([importPath, functionNames]) => 
        `import { ${Array.from(functionNames).join(', ')} } from '${importPath}';`
      )
      .join('\n');
  }
  
  private generateServerRegistration(func: RPCFunction): string {
    const functionKey = this.generateFunctionKey(func);
    return `registerFunction('${functionKey}', ${func.name});`;
  }
  
  generateTypeDefinitions(functions: RPCFunction[]): string {
    const typeExports = functions.map(func => this.generateTypeDefinition(func)).join('\n');
    
    return `// Auto-generated RPC type definitions\n\n${typeExports}`;
  }
  
  private generateTypeDefinition(func: RPCFunction): string {
    const paramsList = func.parameters.map(p => `${p.name}${p.optional ? '?' : ''}: ${p.type}`).join(', ');
    const returnType = this.extractReturnType(func.returnType);
    
    return `export type ${func.name}Function = (${paramsList}) => Promise<${returnType}>;`;
  }
  
  generateIndexFile(functions: RPCFunction[]): string {
    const exports = functions.map(func => `export { ${func.name} } from './client-stubs.js';`).join('\n');
    
    return `// Auto-generated RPC exports\n\n${exports}\n\n// Re-export types\nexport * from './types.js';`;
  }
  
  generateDevRoutes(functions: RPCFunction[]): string {
    const routesList = functions.map(func => {
      const key = this.generateFunctionKey(func);
      return `  '${key}': {
    name: '${func.name}',
    file: '${func.filePath}',
    parameters: ${JSON.stringify(func.parameters, null, 4)},
    returnType: '${func.returnType}'
  }`;
    }).join(',\n');
    
    return `// Auto-generated development routes\n\nexport const rpcRoutes = {\n${routesList}\n};\n\nexport const functionCount = ${functions.length};`;
  }
}
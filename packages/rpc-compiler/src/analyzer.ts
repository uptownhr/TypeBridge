import * as ts from 'typescript';
import * as path from 'path';

export interface RPCFunction {
  name: string;
  filePath: string;
  isAsync: boolean;
  parameters: Array<{
    name: string;
    type: string;
    optional: boolean;
  }>;
  returnType: string;
  exportedAs: 'named' | 'default';
}

export interface AnalysisResult {
  functions: RPCFunction[];
  dependencies: string[];
  errors: string[];
}

export class RPCAnalyzer {
  private program: ts.Program;
  private typeChecker: ts.TypeChecker;
  
  constructor(private configPath: string = 'tsconfig.json') {
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    if (config.error) {
      throw new Error(`Failed to read TypeScript config: ${config.error.messageText}`);
    }
    
    const parsed = ts.parseJsonConfigFileContent(
      config.config,
      ts.sys,
      path.dirname(configPath)
    );
    
    this.program = ts.createProgram(parsed.fileNames, parsed.options);
    this.typeChecker = this.program.getTypeChecker();
  }
  
  analyzeServerDirectory(serverDir: string): AnalysisResult {
    const result: AnalysisResult = {
      functions: [],
      dependencies: [],
      errors: []
    };
    
    const sourceFiles = this.program.getSourceFiles()
      .filter(file => file.fileName.includes(serverDir) && !file.fileName.includes('node_modules'));
    
    for (const sourceFile of sourceFiles) {
      try {
        const fileFunctions = this.extractFunctionsFromFile(sourceFile);
        result.functions.push(...fileFunctions);
      } catch (error) {
        result.errors.push(`Error analyzing ${sourceFile.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return result;
  }
  
  private extractFunctionsFromFile(sourceFile: ts.SourceFile): RPCFunction[] {
    const functions: RPCFunction[] = [];
    
    const visit = (node: ts.Node) => {
      if (ts.isFunctionDeclaration(node) && node.name && this.isExported(node)) {
        const func = this.analyzeFunctionDeclaration(node, sourceFile);
        if (func && this.isValidRPCFunction(func)) {
          functions.push(func);
        }
      } else if (ts.isVariableStatement(node) && this.isExported(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isVariableDeclaration(declaration) && 
              declaration.initializer && 
              (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer))) {
            const func = this.analyzeVariableFunction(declaration, sourceFile);
            if (func && this.isValidRPCFunction(func)) {
              functions.push(func);
            }
          }
        }
      }
      
      ts.forEachChild(node, visit);
    };
    
    visit(sourceFile);
    return functions;
  }
  
  private analyzeFunctionDeclaration(node: ts.FunctionDeclaration, sourceFile: ts.SourceFile): RPCFunction | null {
    if (!node.name) return null;
    
    const signature = this.typeChecker.getSignatureFromDeclaration(node);
    if (!signature) return null;
    
    return {
      name: node.name.text,
      filePath: sourceFile.fileName,
      isAsync: this.isAsyncFunction(node),
      parameters: this.extractParameters(node),
      returnType: this.getReturnType(signature),
      exportedAs: 'named'
    };
  }
  
  private analyzeVariableFunction(declaration: ts.VariableDeclaration, sourceFile: ts.SourceFile): RPCFunction | null {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) return null;
    
    const func = declaration.initializer as ts.ArrowFunction | ts.FunctionExpression;
    
    return {
      name: declaration.name.text,
      filePath: sourceFile.fileName,
      isAsync: this.isAsyncFunction(func),
      parameters: this.extractParameters(func),
      returnType: this.typeChecker.typeToString(this.typeChecker.getTypeAtLocation(func)),
      exportedAs: 'named'
    };
  }
  
  private isExported(node: ts.Node): boolean {
    return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
  }
  
  private isAsyncFunction(node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression): boolean {
    return node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword) ?? false;
  }
  
  private extractParameters(node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression): Array<{name: string, type: string, optional: boolean}> {
    return node.parameters.map(param => ({
      name: ts.isIdentifier(param.name) ? param.name.text : 'unknown',
      type: param.type ? this.typeChecker.typeToString(this.typeChecker.getTypeAtLocation(param.type)) : 'any',
      optional: !!param.questionToken
    }));
  }
  
  private getReturnType(signature: ts.Signature): string {
    return this.typeChecker.typeToString(signature.getReturnType());
  }
  
  private isValidRPCFunction(func: RPCFunction): boolean {
    if (!func.isAsync) {
      return false;
    }
    
    if (!func.returnType.includes('Promise')) {
      return false;
    }
    
    return this.areParametersSerializable(func.parameters);
  }
  
  private areParametersSerializable(parameters: Array<{name: string, type: string, optional: boolean}>): boolean {
    const serializableTypes = [
      'string', 'number', 'boolean', 'null', 'undefined',
      'Date', 'Array', 'Object', 'any'
    ];
    
    return parameters.every(param => {
      const baseType = param.type.replace(/\[\]|\s*\|\s*null|\s*\|\s*undefined/g, '');
      return serializableTypes.some(type => baseType.includes(type)) || 
             baseType.includes('Record<') || 
             baseType.includes('{');
    });
  }
  
  generateFunctionPath(func: RPCFunction): string {
    const relativePath = path.relative(process.cwd(), func.filePath);
    const modulePath = relativePath.replace(/\.ts$/, '').replace(/\\/g, '/');
    return `${modulePath}.${func.name}`;
  }
}
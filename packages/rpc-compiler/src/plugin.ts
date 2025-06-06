import type { BunPlugin } from 'bun';
import { RPCAnalyzer } from './analyzer.js';
import { CodeGenerator } from './generator.js';
import * as path from 'path';
import * as fs from 'fs';

export interface RPCPluginOptions {
  serverDir?: string;
  clientDir?: string;
  outputDir?: string;
  watch?: boolean;
}

export function rpcPlugin(options: RPCPluginOptions = {}): BunPlugin {
  const serverDir = options.serverDir || 'src/server';
  const clientDir = options.clientDir || 'src/client';
  const outputDir = options.outputDir || 'src/generated';
  const watch = options.watch ?? true;
  
  let analyzer: RPCAnalyzer;
  let generator: CodeGenerator;
  let lastGenerationTime = 0;
  
  return {
    name: 'seamless-rpc',
    
    setup(build) {
      try {
        analyzer = new RPCAnalyzer();
        generator = new CodeGenerator({
          outputDir,
          serverDir,
          clientDir
        });
      } catch (error) {
        console.warn('RPC Plugin: Failed to initialize analyzer:', error);
        return;
      }
      
      // Generate RPC code on build start
      build.onStart(() => {
        try {
          generateRPCCode();
        } catch (error) {
          console.error('RPC Plugin: Failed to generate code:', error);
        }
      });
      
      // Handle server function imports
      build.onResolve({ filter: new RegExp(`^@/${serverDir.replace(/^src\//, '')}`) }, (args) => {
        if (args.importer.includes(clientDir)) {
          // Client trying to import server function - redirect to generated stub
          const serverPath = args.path.replace('@/', 'src/');
          const stubPath = path.join(outputDir, 'client-stubs.js');
          
          return {
            path: path.resolve(stubPath),
            namespace: 'rpc-stub'
          };
        }
        
        // Normal server import
        return {
          path: path.resolve(args.path.replace('@/', 'src/') + '.ts')
        };
      });
      
      // Handle generated file loads
      build.onLoad({ filter: /src\/generated\/.*\.js$/ }, async (args) => {
        if (!fs.existsSync(args.path)) {
          // File doesn't exist yet, generate it
          await generateRPCCode();
        }
        
        if (fs.existsSync(args.path)) {
          return {
            contents: fs.readFileSync(args.path, 'utf8'),
            loader: 'js'
          };
        }
        
        return {
          contents: '// RPC code not yet generated',
          loader: 'js'
        };
      });
      
      // Watch for changes in server directory
      if (watch) {
        const watchPath = path.resolve(serverDir);
        if (fs.existsSync(watchPath)) {
          fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
            if (filename && filename.endsWith('.ts')) {
              const now = Date.now();
              if (now - lastGenerationTime > 1000) { // Debounce
                lastGenerationTime = now;
                setTimeout(() => generateRPCCode(), 100);
              }
            }
          });
        }
      }
    }
  };
  
  function generateRPCCode(): void {
    try {
      const result = analyzer.analyzeServerDirectory(serverDir);
      
      if (result.errors.length > 0) {
        console.warn('RPC Plugin: Analysis errors:');
        result.errors.forEach(error => console.warn('  -', error));
      }
      
      if (result.functions.length === 0) {
        console.log('RPC Plugin: No RPC functions found');
        return;
      }
      
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Generate client stubs
      const clientStubs = generator.generateClientStubs(result.functions);
      fs.writeFileSync(path.join(outputDir, 'client-stubs.js'), clientStubs);
      
      // Generate server routes
      const serverRoutes = generator.generateServerRoutes(result.functions);
      fs.writeFileSync(path.join(outputDir, 'api-routes.js'), serverRoutes);
      
      // Generate type definitions
      const typeDefinitions = generator.generateTypeDefinitions(result.functions);
      fs.writeFileSync(path.join(outputDir, 'types.js'), typeDefinitions);
      
      // Generate index file
      const indexFile = generator.generateIndexFile(result.functions);
      fs.writeFileSync(path.join(outputDir, 'index.js'), indexFile);
      
      // Generate development routes for debugging
      const devRoutes = generator.generateDevRoutes(result.functions);
      fs.writeFileSync(path.join(outputDir, 'dev-routes.js'), devRoutes);
      
      console.log(`RPC Plugin: Generated ${result.functions.length} RPC function stubs`);
      
    } catch (error) {
      console.error('RPC Plugin: Code generation failed:', error);
    }
  }
}
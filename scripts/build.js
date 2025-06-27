import { execSync } from 'child_process';
import { rmSync } from 'fs';
import { join } from 'path';
import esbuild from 'esbuild';

const buildConfig = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  sourcemap: true,
  target: 'esnext',
  external: ['node:*'],
  outdir: 'lib',
  minify: false,
  metafile: true,
  define: {
    'process.env.NODE_ENV': '"production"'
  }
};

async function build(watch = false) {
  try {
    if (!watch) {
      console.log('🧹 Cleaning up...');
      // Clean up build directories
      rmSync('lib', { recursive: true, force: true });
      rmSync('@types', { recursive: true, force: true });
      
      console.log('📝 Type checking and generating declarations...');
      // Use tsc only for type checking and declaration generation
      execSync('tsc --emitDeclarationOnly --noEmit false', { stdio: 'inherit' });
      
      console.log('⚡ Transpiling TypeScript with esbuild...');
      // Use esbuild for TypeScript transpilation
      const transpileConfig = {
        entryPoints: ['src/**/*.ts'],
        bundle: false,
        platform: 'node',
        format: 'esm',
        sourcemap: true,
        target: 'esnext',
        outdir: 'lib',
        minify: false,
        loader: {
          '.ts': 'ts'
        }
      };
      await esbuild.build(transpileConfig);
    }
    
    console.log('📦 Creating main entry point...');
    
    if (watch) {
      // Watch mode
      const context = await esbuild.context(buildConfig);
      await context.watch();
      console.log('👀 Watching for changes...');
    } else {
      // Single build - create unbundled main.js for tests
      const unbundledConfig = {
        entryPoints: ['src/main.ts'],
        bundle: false,
        platform: 'node',
        format: 'esm',
        sourcemap: true,
        target: 'esnext',
        outdir: 'lib',
        minify: false
      };
      await esbuild.build(unbundledConfig);
      console.log('✅ Build completed successfully');
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Check if watch mode is requested
const isWatch = process.argv.includes('--watch');

// Run build if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build(isWatch);
}

export default build; 
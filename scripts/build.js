import { rmSync } from 'fs';
import esbuild from 'esbuild';

const buildConfig = {
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

async function build(watch = false) {
  try {
    if (!watch) {
      console.log('🧹 Cleaning up...');
      // Clean up build directories
      rmSync('lib', { recursive: true, force: true });
      rmSync('@types', { recursive: true, force: true });
      
      console.log('⚡ Transpiling TypeScript with esbuild...');
      // Use esbuild for TypeScript transpilation
      await esbuild.build(buildConfig);
      console.log('✅ Build completed successfully');
    } else {
      // Watch mode
      console.log('👀 Watching for changes...');
      const context = await esbuild.context(buildConfig);
      await context.watch();
    }
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Check if watch mode is requested
const isWatch = process.argv.includes('--watch');

// Run build
build(isWatch);

export default build; 
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
};

// Build function
async function build() {
  try {
    const result = await esbuild.build(buildConfig);
    console.log('Build completed successfully');
    return result;
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run build if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  build();
}

export default buildConfig; 
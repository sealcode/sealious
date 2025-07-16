# Build Configuration

This directory contains the build configuration for the Sealious project.

## Files

- `build.js` - Main build script that handles TypeScript compilation and bundling
- `README.md` - This documentation file

## Build Process

The build process consists of two main steps:

1. **TypeScript Compilation**: Compiles all TypeScript files in the `src/` directory to JavaScript and generates type declarations
2. **Bundling**: Bundles the main entry point (`src/main.ts`) for production use

## Usage

### Build
```bash
npm run build
```

### Watch Mode (Development)
```bash
npm run watch
```

### Type Checking Only
```bash
npm run typecheck
```

## Configuration

The build configuration is defined in `build.js` and includes:

- **Entry Point**: `src/main.ts`
- **Output**: `lib/`
- **Format**: ES Modules (ESM)
- **Platform**: Node.js
- **Target**: ES2020
- **Source Maps**: Enabled
- **External Dependencies**: Node.js built-in modules

## Output Structure

```
lib/
├── main.js          # Bundled main entry point
├── main.js.map      # Source map
└── ...              # Other compiled TypeScript files

@types/              # TypeScript declaration files
```

## Customization

To modify the build configuration, edit the `buildConfig` object in `scripts/build.js`. 
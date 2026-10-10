import { defineConfig } from 'tsup'

// Bundles the API (including @123/shared) into a single file so the production image
// needs no node_modules for workspace packages.
export default defineConfig({
  entry: ['src/index.ts', 'src/scripts/create-admin.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@123/shared'],
})

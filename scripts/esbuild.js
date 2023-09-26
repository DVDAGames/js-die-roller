#!/usr/bin/env node

import esbuild from 'esbuild'

esbuild
  .build({
    entryPoints: ['src/index.ts'],
    outdir: 'lib',
    bundle: true,
    sourcemap: true,
    minify: true,
    splitting: true,
    format: 'esm',
    target: ['esnext'],
    platform: 'node',
  })
  .catch(() => process.exit(1))

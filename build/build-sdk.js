/**
 * Bundles @oasisomniverse/web4-api, web5-api, and web6-api into
 * self-contained browser scripts that expose window.OASISClient,
 * window.STARClient, and window.Web6Client respectively.
 *
 * Run: npm run build-sdk
 * Output: assets/js/oasis-web4-sdk.js, oasis-web5-sdk.js, oasis-web6-sdk.js
 */
const esbuild = require('esbuild');
const path = require('path');

const outDir = path.resolve(__dirname, '../assets/js');

async function build() {
  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'web4-entry.js')],
    bundle: true,
    format: 'iife',
    globalName: '_OASIS_WEB4_UNUSED_',
    platform: 'browser',
    target: ['es2018'],
    outfile: path.join(outDir, 'oasis-web4-sdk.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: false, // keep readable for debugging
    banner: {
      js: '/* @oasisomniverse/web4-api browser bundle — auto-generated, do not edit */'
    },
  });
  console.log('✓ oasis-web4-sdk.js built');

  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'web5-entry.js')],
    bundle: true,
    format: 'iife',
    globalName: '_OASIS_WEB5_UNUSED_',
    platform: 'browser',
    target: ['es2018'],
    outfile: path.join(outDir, 'oasis-web5-sdk.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: false,
    banner: {
      js: '/* @oasisomniverse/web5-api browser bundle — auto-generated, do not edit */'
    },
  });
  console.log('✓ oasis-web5-sdk.js built');

  await esbuild.build({
    entryPoints: [path.resolve(__dirname, 'web6-entry.js')],
    bundle: true,
    format: 'iife',
    globalName: '_OASIS_WEB6_UNUSED_',
    platform: 'browser',
    target: ['es2018'],
    outfile: path.join(outDir, 'oasis-web6-sdk.js'),
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: false,
    banner: {
      js: '/* @oasisomniverse/web6-api browser bundle — auto-generated, do not edit */'
    },
  });
  console.log('✓ oasis-web6-sdk.js built');
}

build().catch(err => { console.error(err); process.exit(1); });

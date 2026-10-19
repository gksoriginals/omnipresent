import {build} from 'esbuild';
await build({entryPoints:['server/index.ts'],outfile:'native-build/server.mjs',bundle:true,packages:'external',platform:'node',format:'esm',target:'node22',sourcemap:false});

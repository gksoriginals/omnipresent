import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {compactAssets,localCases,precisionScreen} from './compact-local-fixture.js';
const id=process.argv[2];if(!id||!/^RUN-[\w-]+$/.test(id))throw Error('Unique run ID required');const root=`docs/validation/runs/${id}`;await mkdir(root);
const inputs={version:1,assets:compactAssets(),cases:localCases,passes:3,precisionScreen,prompt:'Choose the prepared content requested now. Hold for no change, negation, quotation or ambiguity. Context if the requested evidence is unavailable.',hold:'Keep current content; no change requested.',context:'The requested evidence is unavailable.'};
const bytes=JSON.stringify(inputs,null,2);await writeFile(`${root}/inputs.json`,bytes);
const sourceFiles=[];for(const path of ['scripts/compact-local-fixture.ts','scripts/prepare-compact-local.ts','runtime/compact_local_benchmark.py','runtime/classifier-requirements.lock']){const content=await readFile(path),target=`${root}/source-snapshot/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,content);sourceFiles.push({path,sha256:createHash('sha256').update(content).digest('hex')});}
await writeFile(`${root}/start-manifest.json`,JSON.stringify({id,startedAt:new Date().toISOString(),inputHash:createHash('sha256').update(bytes).digest('hex'),sourceFiles,modelRevisions:{'gliner-multi':'e173bca1f0c4217d7a55b3b0c705d5ece8a0218d','gliner-english':'9d1bfb848cd16d93ee56ccbc59cd92bf0f284d90'}},null,2));console.log(root);

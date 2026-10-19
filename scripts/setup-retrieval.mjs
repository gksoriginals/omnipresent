import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
if(!existsSync('output/retrieval-venv/bin/python'))execFileSync('uv',['venv','--python','3.12','output/retrieval-venv'],{stdio:'inherit'});
execFileSync('uv',['pip','sync','--python','output/retrieval-venv/bin/python','runtime/retrieval-requirements.lock'],{stdio:'inherit'});
console.log('Start with npm run retrieval:serve. The pinned model is downloaded on first start.');

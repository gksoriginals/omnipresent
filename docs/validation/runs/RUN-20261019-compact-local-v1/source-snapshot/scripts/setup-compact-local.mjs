import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const python='output/classifier-venv/bin/python';
if(!existsSync(python))execFileSync('uv',['venv','--python','3.12','output/classifier-venv'],{stdio:'inherit'});
execFileSync('uv',['pip','sync','--python',python,'runtime/classifier-requirements.lock'],{stdio:'inherit'});
console.log('Isolated classifier runtime installed from lock; pinned model files are downloaded separately.');

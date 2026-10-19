import {execFileSync} from 'node:child_process';
import {readFileSync,statSync,existsSync} from 'node:fs';
const files=execFileSync('git',['ls-files','-z'],{encoding:'utf8'}).split('\0').filter(Boolean),errors=[];
for(const path of ['README.md','LICENSE','CONTRIBUTING.md','CODE_OF_CONDUCT.md','SECURITY.md','SUPPORT.md','GOVERNANCE.md','ROADMAP.md','THIRD_PARTY_NOTICES.md','.github/workflows/ci.yml','.env.example'])if(!existsSync(path))errors.push(`Missing ${path}`);
for(const path of files){
 if(/^(node_modules|output|dist|\.venv|\.codex-artifacts|\.playwright-cli)\//.test(path)||/(^|\/)\.env(?:\..+)?$/.test(path)&&path!=='.env.example'||/\.(pem|key|p12|pfx|keystore|sqlite|sqlite3|db|safetensors|onnx)$/.test(path))errors.push(`Forbidden publication artifact: ${path}`);
 if(/(^|\/)(\.npmrc|\.netrc|\.pypirc)$/.test(path))errors.push(`Credential configuration must stay local: ${path}`);
 if(existsSync(path)&&statSync(path).size>10*1024*1024)errors.push(`Oversized tracked file: ${path}`);
}
const transport=readFileSync('server/models/decision-transport.ts','utf8');
if(/CEREBRO_AUTH_FILE|homedir|auth\.json/.test(transport))errors.push('Credential discovery outside explicit environment configuration');
const p=JSON.parse(readFileSync('package.json','utf8'));
if(!p.license||p.license==='UNLICENSED')errors.push('Explicit open-source package license required');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`Publication checks passed for ${files.length} tracked files. Run Gitleaks separately; this is not a complete secret/privacy audit.`);

import {cp,mkdir,readFile,rm,writeFile,chmod} from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync,spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=join(root,'output');
const out=join(output,'macos');
const stage=join(out,'stage');
const app=join(out,'Omnipresent.app');
const contents=join(app,'Contents');
const resources=join(contents,'Resources');
const nodeVersion='22.22.1';
const nodeArchiveName=`node-v${nodeVersion}-darwin-arm64.tar.gz`;
const nodeSha256='679ad4966339e4ef4900f57996714864e4211b898825bb840c3086c419fbcef2';
const runtimeCache=join(output,'tool-cache',`node-v${nodeVersion}-darwin-arm64`);

if(process.platform!=='darwin'||process.arch!=='arm64')throw Error('The current app build targets Apple Silicon macOS 14+.');

async function ensureNodeRuntime(){
  const binary=join(runtimeCache,'bin','node');
  try{
    const version=execFileSync(binary,['--version'],{encoding:'utf8'}).trim();
    if(version===`v${nodeVersion}`)return binary;
  }catch{}
  await mkdir(runtimeCache,{recursive:true});
  const archive=join(output,'tool-cache',nodeArchiveName);
  try{
    const info=await readFile(archive);
    if(createHash('sha256').update(info).digest('hex')!==nodeSha256)await rm(archive,{force:true});
  }catch{}
  try{await readFile(archive);}catch{
    const response=await fetch(`https://nodejs.org/dist/v${nodeVersion}/${nodeArchiveName}`);
    if(!response.ok||!response.body)throw Error(`Could not download the pinned Node ${nodeVersion} runtime (HTTP ${response.status}).`);
    await pipeline(Readable.fromWeb(response.body),createWriteStream(archive));
  }
  const actual=createHash('sha256').update(await readFile(archive)).digest('hex');
  if(actual!==nodeSha256)throw Error(`Node runtime checksum mismatch: ${actual}`);
  execFileSync('tar',['-xzf',archive,'--strip-components=1','-C',runtimeCache],{stdio:'inherit'});
  const version=execFileSync(binary,['--version'],{encoding:'utf8'}).trim();
  if(version!==`v${nodeVersion}`)throw Error(`Unexpected embedded Node version ${version}.`);
  return binary;
}

async function smokeTestPackagedCoordinator(node,serverPath){
  const port=await findPort();
  const dataDir=join(stage,'smoke-data');
  const child=spawn(node,[serverPath],{cwd:join(resources,'app'),env:{...process.env,PORT:String(port),OMNIPRESENT_TEST_EMBEDDINGS:'1',OMNIPRESENT_DATA_DIR:dataDir,OMNIPRESENT_SETTINGS_PATH:join(dataDir,'settings.json'),OMNIPRESENT_DB_PATH:join(dataDir,'workspace.sqlite'),OMNIPRESENT_MATERIALS_PATH:join(dataDir,'materials')},stdio:'ignore'});
  try{
    let ready=false;
    for(let attempt=0;attempt<100;attempt++){
      if(child.exitCode!==null)throw Error(`Packaged coordinator exited early (${child.exitCode}).`);
      try{const response=await fetch(`http://127.0.0.1:${port}/api/health`,{signal:AbortSignal.timeout(300)});if(response.ok){ready=true;break;}}catch{}
      await new Promise(resolve=>setTimeout(resolve,50));
    }
    if(!ready)throw Error('Packaged coordinator did not pass its health check.');
    const settings=await fetch(`http://127.0.0.1:${port}/api/settings/model`);
    if(!settings.ok)throw Error('Packaged coordinator model settings endpoint failed.');
    console.log('Packaged coordinator health and settings endpoints passed.');
  }finally{
    await new Promise(resolve=>{child.once('exit',resolve);child.kill('SIGTERM');});
  }
}

function findPort(){
  const server=createServer();
  return new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',()=>{const address=server.address();const port=typeof address==='object'&&address?address.port:0;server.close(error=>error?reject(error):resolve(port));});});
}

await rm(out,{recursive:true,force:true});
await mkdir(join(stage,'app'),{recursive:true});
await mkdir(join(resources,'app'),{recursive:true});
await mkdir(join(resources,'node','bin'),{recursive:true});
await mkdir(join(resources,'licenses'),{recursive:true});
await mkdir(join(contents,'MacOS'),{recursive:true});
for(const name of ['package.json','package-lock.json'])await cp(join(root,name),join(stage,name));
execFileSync('npm',['ci','--omit=dev','--ignore-scripts','--no-audit','--no-fund'],{cwd:stage,stdio:'inherit'});

// The app uses Transformers.js' Node backend. Keep only the macOS arm64 ONNX native runtime.
const modules=join(stage,'node_modules');
for(const path of ['onnxruntime-web','onnxruntime-node/bin/napi-v6/linux','onnxruntime-node/bin/napi-v6/win32','onnxruntime-node/bin/napi-v6/darwin/x64','tesseract.js','tesseract.js-core'])await rm(join(modules,path),{recursive:true,force:true});
const node=await ensureNodeRuntime();
execFileSync(process.execPath,[join(root,'scripts','build-native-coordinator.mjs')],{cwd:root,stdio:'inherit'});
const serverPath=join(resources,'app','server.mjs');
await cp(join(root,'native-build','server.mjs'),serverPath);
await cp(modules,join(resources,'app','node_modules'),{recursive:true});
await cp(join(root,'package.json'),join(resources,'app','package.json'));
await cp(node,join(resources,'node','bin','node'));
await cp(join(runtimeCache,'LICENSE'),join(resources,'licenses','node-LICENSE'));
await chmod(join(resources,'node','bin','node'),0o755);

const executable=join(contents,'MacOS','Omnipresent');
execFileSync('swiftc',['-target','arm64-apple-macosx14.0','-framework','SwiftUI','-framework','AppKit','-framework','Charts','-framework','AVFoundation','-framework','Speech',...['AppModel.swift','LocalSpeechCapture.swift','OmnipresentApp.swift','RootView.swift'].map(file=>join(root,'macos',file)),'-o',executable],{cwd:root,stdio:'inherit'});
await chmod(executable,0o755);
const plist=`<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>CFBundleExecutable</key><string>Omnipresent</string><key>CFBundleIdentifier</key><string>com.omnipresent.app</string><key>CFBundleName</key><string>Omnipresent</string><key>CFBundleDisplayName</key><string>Omnipresent</string><key>CFBundlePackageType</key><string>APPL</string><key>CFBundleShortVersionString</key><string>0.1.0</string><key>CFBundleVersion</key><string>1</string><key>LSMinimumSystemVersion</key><string>14.0</string><key>NSHighResolutionCapable</key><true/><key>NSMicrophoneUsageDescription</key><string>Omnipresent listens locally so the presentation canvas can follow your explanation.</string><key>NSSpeechRecognitionUsageDescription</key><string>Omnipresent uses on-device speech recognition to follow your presentation.</string></dict></plist>\n`;
await writeFile(join(contents,'Info.plist'),plist);
execFileSync(join(resources,'node','bin','node'),['--input-type=module','--eval','await import("@huggingface/transformers"); await import("onnxruntime-node");'],{cwd:join(resources,'app'),stdio:'inherit'});
console.log('Bundled Node, Transformers.js and native ONNX modules loaded.');
await smokeTestPackagedCoordinator(join(resources,'node','bin','node'),serverPath);
try{execFileSync('codesign',['--force','--deep','--sign','-',app],{stdio:'ignore'});}catch{}
await rm(stage,{recursive:true,force:true});
console.log(`Built ${app}`);

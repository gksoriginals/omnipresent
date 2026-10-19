import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
if(!existsSync("output/tts-venv/bin/python"))execFileSync("uv",["venv","--python","3.12","output/tts-venv"],{stdio:"inherit"});
execFileSync("uv",["pip","sync","--python","output/tts-venv/bin/python","runtime/tts-requirements.lock"],{stdio:"inherit"});
execFileSync("output/tts-venv/bin/python",["-m","piper.download_voices","en_US-ljspeech-high","--data-dir","output/voices"],{stdio:"inherit"});
const expected=JSON.parse(readFileSync("runtime/tts-model.json","utf8"));
for(const [file,hash] of Object.entries(expected.sha256)){
 if(createHash("sha256").update(readFileSync(`output/voices/${file}`)).digest("hex")!==hash)throw Error(`Voice artifact changed: ${file}; review before updating checksums`);
}

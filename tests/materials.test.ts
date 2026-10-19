import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn, execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { setTimeout as wait } from "node:timers/promises";
test("local upload extraction handles PDF, Office and images; rejects unsupported files and origins", {skip: !existsSync(".venv/bin/python"), timeout:60000}, async () => {
 execFileSync(".venv/bin/python", ["scripts/prepare-material-fixtures.py"]);
 const child = spawn(process.execPath,["--import","tsx","server/index.ts"],{env:{...process.env,PORT:"4330"},stdio:"pipe"});
 try {
  let ready = false;
  for(let i=0;i<100;i++) {try {if((await fetch("http://127.0.0.1:4330/api/health")).ok){ready=true;break;}}catch{} await wait(30);}
  assert.ok(ready);
  for(const name of ["notes.pdf","notes.docx","notes.pptx","data.xlsx","sample.png"]) {
   const result = await fetch("http://127.0.0.1:4330/api/materials",{method:"POST",headers:{"X-File-Name":name},body:await readFile(`output/probe/material-fixtures/${name}`)});
   const material = await result.json() as any;
   assert.equal(result.status,200,JSON.stringify(material)); assert.ok(material.content.length);
   if(name === "sample.png") {assert.ok(material.media.url); assert.equal((await fetch(`http://127.0.0.1:4330${material.media.url}`)).status,200);}
   else assert.ok(/solar|Morning/.test(material.content),name);
  }
  const denied = await fetch("http://127.0.0.1:4330/api/materials",{method:"POST",headers:{"X-File-Name":"bad.exe"},body:"bad"}); assert.equal(denied.status,400);
  const foreign = await fetch("http://127.0.0.1:4330/api/materials",{method:"POST",headers:{"X-File-Name":"notes.txt",Origin:"https://other.example"},body:"bad"}); assert.equal(foreign.status,400);
 } finally {child.kill(); await new Promise<void>(ok=>child.once("exit",()=>ok()));}
});

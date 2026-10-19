import {test} from "node:test";
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {setTimeout as wait} from "node:timers/promises";
import {zipSync,strToU8} from "fflate";

const docx=zipSync({
 "[Content_Types].xml":strToU8('<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'),
 "_rels/.rels":strToU8('<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'),
 "word/document.xml":strToU8('<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Solar panels convert sunlight into electricity.</w:t></w:r></w:p></w:body></w:document>'),
});
test("TypeScript material extraction handles text, DOCX and images; rejects unsupported files and origins",{timeout:60000},async()=>{
 const child=spawn(process.execPath,["--import","tsx","server/index.ts"],{env:{...process.env,PORT:"4330",OMNIPRESENT_TEST_EMBEDDINGS:"1",OMNIPRESENT_MATERIALS_PATH:"output/test-materials"},stdio:"pipe"});
 try{
  let ready=false;for(let i=0;i<100;i++){try{if((await fetch("http://127.0.0.1:4330/api/health")).ok){ready=true;break;}}catch{}await wait(30);}assert.ok(ready);
  const upload=async(name:string,body:BodyInit)=>{const result=await fetch("http://127.0.0.1:4330/api/materials",{method:"POST",headers:{"X-File-Name":name},body});return {result,material:await result.json() as any};};
  const plain=await upload("notes.md","Solar panels convert sunlight into electricity.");assert.equal(plain.result.status,200);assert.match(plain.material.content,/Solar panels/);
  const office=await upload("notes.docx",docx);assert.equal(office.result.status,200,JSON.stringify(office.material));assert.match(office.material.content,/Solar panels/);
  const image=await upload("sample.png",new Uint8Array([137,80,78,71,13,10,26,10]));assert.equal(image.result.status,200);assert.ok(image.material.media.url);assert.equal((await fetch(`http://127.0.0.1:4330${image.material.media.url}`)).status,200);
  const denied=await fetch("http://127.0.0.1:4330/api/materials",{method:"POST",headers:{"X-File-Name":"bad.exe"},body:"bad"});assert.equal(denied.status,400);
  const foreign=await fetch("http://127.0.0.1:4330/api/materials",{method:"POST",headers:{"X-File-Name":"notes.txt",Origin:"https://other.example"},body:"bad"});assert.equal(foreign.status,400);
 }finally{child.kill();await new Promise<void>(ok=>child.once("exit",()=>ok()));}
});

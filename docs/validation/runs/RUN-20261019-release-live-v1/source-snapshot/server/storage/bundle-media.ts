import {createHash} from "node:crypto";
import {mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {bundleSchema,type OmnipresentBundle} from "../../shared/workspace.js";
export const materialRoot=()=>resolve(process.env.OMNIPRESENT_MATERIALS_PATH??"output/materials");
const digest=(data:Buffer)=>createHash("sha256").update(data).digest("hex");
function referenced(bundle:OmnipresentBundle){return [...new Set(bundle.story.state.artifacts.flatMap(a=>a.media?[a.media.url]:[]))];}
export function packMedia(bundle:OmnipresentBundle):OmnipresentBundle {
 let size=0;
 return {...bundle,files:referenced(bundle).map(url=>{
  const data=readFileSync(resolve(materialRoot(),url.split("/").at(-1)!));
  size+=data.length;
  if(data.length>8_000_000||size>24_000_000)throw Error("Story media exceeds the 24 MB bundle limit");
  if(!url.includes(`/${digest(data)}.`))throw Error("Stored media hash mismatch");
  return {url,base64:data.toString("base64")};
 })};
}
export function unpackMedia(raw:unknown):OmnipresentBundle {
 const bundle=bundleSchema.parse(raw),urls=referenced(bundle),files=bundle.files??[];
 if(new Set(files.map(f=>f.url)).size!==files.length||files.some(f=>!urls.includes(f.url)))throw Error("Unexpected or duplicate bundle media");
 let size=0;
 // Validate the complete bundle before writing any files or changing the workspace.
 const validated=urls.map(url=>{
  const file=files.find(f=>f.url===url);
  if(!file){
   const existing=readFileSync(resolve(materialRoot(),url.split("/").at(-1)!));
   if(!url.includes(`/${digest(existing)}.`))throw Error("Missing or invalid bundle media");
   return {url,data:existing};
  }
  const data=Buffer.from(file.base64,"base64");size+=data.length;
  if(data.toString("base64")!==file.base64||data.length>8_000_000||size>24_000_000||!url.includes(`/${digest(data)}.`))throw Error("Invalid bundle media or content hash");
  return {url,data};
 });
 mkdirSync(materialRoot(),{recursive:true});
 for(const {url,data} of validated)writeFileSync(resolve(materialRoot(),url.split("/").at(-1)!),data);
 return bundle;
}

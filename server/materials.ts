import type {IncomingMessage,ServerResponse} from "node:http";
import {createHash} from "node:crypto";
import {mkdir,readFile,writeFile,unlink} from "node:fs/promises";
import {resolve,extname} from "node:path";
import {OfficeParser} from "officeparser";

const root=resolve(process.env.OMNIPRESENT_MATERIALS_PATH??resolve(process.env.OMNIPRESENT_DATA_DIR??"output/omnipresent","materials"));
const imagePattern=/\.(png|jpe?g|webp)$/;
const officeTypes:Record<string,string>={".pdf":"pdf",".docx":"docx",".pptx":"pptx",".xlsx":"xlsx"};
function imageMime(extension:string){const type=extension.slice(1).replace("jpg","jpeg");return `image/${type}`;}
export async function materials(req:IncomingMessage,res:ServerResponse,allowedOrigins:Set<string>){
 if(!req.url?.startsWith("/api/materials"))return false;
 try{
  if(req.method==="GET"&&/^\/api\/materials\/[a-f0-9]{64}\.(png|jpg|jpeg|webp)$/.test(req.url)){
   const extension=extname(req.url),data=await readFile(resolve(root,req.url.split("/").at(-1)!));
   res.setHeader("Content-Type",imageMime(extension));res.setHeader("X-Content-Type-Options","nosniff");res.setHeader("Cache-Control","private, max-age=31536000, immutable");res.end(data);return true;
  }
  if(req.method!=="POST"||req.url!=="/api/materials")throw Error("Unsupported material request");
  if(req.headers.origin&&!allowedOrigins.has(req.headers.origin))throw Error("Unsupported upload origin");
  const name=decodeURIComponent(String(req.headers["x-file-name"]??"")),extension=extname(name).toLowerCase();
  if(!name||name.length>160||!/\.(pdf|docx|pptx|xlsx|txt|md|csv|json|png|jpg|jpeg|webp)$/.test(extension))throw Error("Choose PDF, Word, PowerPoint, Excel, text, CSV, JSON, PNG, JPEG or WebP.");
  const chunks:Buffer[]=[];let size=0;
  for await(const chunk of req){size+=chunk.length;if(size>8_000_000)throw Error("Choose a file smaller than 8 MB.");chunks.push(Buffer.from(chunk));}
  const data=Buffer.concat(chunks);if(!data.length)throw Error("The file is empty");
  const digest=createHash("sha256").update(data).digest("hex"),isImage=imagePattern.test(extension);
  await mkdir(root,{recursive:true});const path=resolve(root,digest+extension);
  if(isImage){await writeFile(path,data);res.setHeader("Content-Type","application/json");res.end(JSON.stringify({name,content:"Uploaded image. Ask the presenter what it shows and how it should be used. No automatic OCR or image understanding has been performed.",media:{url:`/api/materials/${digest}${extension}`,alt:name}}));return true;}
  let content="";
  if(officeTypes[extension]){
   const ast=await OfficeParser.parseOffice(data,{fileType:officeTypes[extension] as any,ocr:false,decompressionLimits:{maxUncompressedBytes:50_000_000,maxZipEntries:3000}});
   content=(await ast.to("text")).value;
  }else content=data.toString("utf8");
  content=content.replace(/\u0000/g,"").trim().slice(0,24_000);
  if(!content)throw Error("No readable text was found in this file. Scanned PDFs need OCR, which is not enabled.");
  res.setHeader("Content-Type","application/json");res.end(JSON.stringify({name,content}));return true;
 }catch(error){res.writeHead(400,{"Content-Type":"application/json"});res.end(JSON.stringify({error:error instanceof Error?error.message:"Could not extract this file. Check its format; scanned PDFs need OCR, which is not enabled."}));return true;}
}

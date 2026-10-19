// Contract-test fixture only: no model downloads, services or quality claims.
import {readFileSync} from 'node:fs';
const space=JSON.parse(readFileSync(new URL('../../runtime/retrieval-model.json',import.meta.url),'utf8'));
const original=globalThis.fetch;
globalThis.fetch=(url,init)=>String(url)==='http://127.0.0.1:4332/embed'
 ? Promise.resolve(Response.json({...space,vectors:JSON.parse(init.body).texts.map(()=>[1,...Array(767).fill(0)])}))
 : original(url,init);

import {readFile,writeFile} from 'node:fs/promises';
try{
 await writeFile('.env',await readFile('.env.example'),{flag:'wx',mode:0o600});
 console.log('Created ignored .env from safe defaults. Edit it locally and restart the app.');
}catch(error){
 if(error.code==='EEXIST')console.log('Existing .env preserved; no settings or credentials overwritten.');
 else throw error;
}

import {WORKSPACE_KEY,readWorkspace,newProject,type Workspace,type StorageLike} from "../../../shared/workspace";
export class WorkspaceStore {
 current:Workspace;
 readonly error:string;
 private storage?:StorageLike;
 constructor(storage:StorageLike|(()=>StorageLike)){
  try{this.storage=typeof storage==="function"?storage():storage;this.current=readWorkspace(this.storage);this.error="";}
  catch(error){const project=newProject();this.current={version:1,activeProjectId:project.id,projects:[project],stories:[]};this.error=error instanceof Error?error.message:"Browser storage is unavailable. Projects cannot be saved.";}
 }
 commit(next:Workspace):{persisted:boolean;error:string}{
  this.current=next;
  if(this.error)return {persisted:false,error:this.error};
  try{this.storage!.setItem(WORKSPACE_KEY,JSON.stringify(next));return {persisted:true,error:""};}
  catch{return {persisted:false,error:"Browser storage is full or unavailable. Recent project changes are kept in this tab but could not be saved."};}
 }
}

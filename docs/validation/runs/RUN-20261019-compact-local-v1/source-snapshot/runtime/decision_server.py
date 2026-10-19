"""Loopback-only, persistent Laya runner for the experimental decision comparison."""
import os,time,threading
os.environ['USE_TF']='0'
import torch
from fastapi import FastAPI,HTTPException
from pydantic import BaseModel
import laya
# CPU is explicit for reproducible local measurements; no auto-download of other checkpoints.
torch.set_num_threads(4)
started=time.perf_counter()
from huggingface_hub import snapshot_download
from laya.common import serialize_state
checkpoint=snapshot_download('convaiinnovations/laya',revision='7b928d828b7b0e022f929d9bd2e44165aa270148',allow_patterns=['rl_agent_config.json','model.safetensors','tokenizer/*','encoder/*'])
agent=laya.load(checkpoint,device='cpu')
print(f'Laya ready after {time.perf_counter()-started:.2f}s',flush=True)
app=FastAPI();lock=threading.Lock()
class Request(BaseModel):
    state:dict|str
    questions:dict
    model:str|None=None
@app.get('/health')
def health():return {'ok':True,'model':'convaiinnovations/laya','device':'cpu'}
@app.post('/v1/systemone')
def decide(body:Request):
    if len(str(body.state))+len(str(body.questions))>16000:raise HTTPException(400,'Decision input too large')
    state_tokens=len(agent.tok(serialize_state(body.state),add_special_tokens=False)['input_ids'])
    for question in body.questions.values():
        text=question.get('instructions','')+' '+' '.join(str(k)+' '+str(v) for k,v in question.get('criteria',{}).items())
        head_tokens=len(agent.tok(text,add_special_tokens=False)['input_ids'])
        if head_tokens+16>agent.cfg.get('head_max_len',192) or head_tokens+state_tokens+16>agent.cfg.get('max_len',512):
            raise HTTPException(400,'Decision exceeds the pinned Laya context; shorten the request instead of silently truncating it')
    with lock:
        began=time.perf_counter()
        result=agent.predict(body.state,body.questions)
        return {**result,'model':'convaiinnovations/laya','computeMs':(time.perf_counter()-began)*1000}
if __name__=='__main__':
    import uvicorn
    uvicorn.run(app,host='127.0.0.1',port=4331)

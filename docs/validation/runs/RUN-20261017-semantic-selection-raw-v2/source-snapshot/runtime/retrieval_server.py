"""Experimental loopback-only pinned text embedding runner. No browser CORS or remote models."""
import os,json,time,threading,resource
from pathlib import Path
os.environ['USE_TF']='0'
os.environ['TOKENIZERS_PARALLELISM']='false'
import torch
from fastapi import FastAPI,HTTPException
from pydantic import BaseModel,Field
from typing import Literal
from sentence_transformers import SentenceTransformer
settings=json.loads(Path('runtime/retrieval-model.json').read_text())
torch.set_num_threads(settings['threads'])
started=time.perf_counter()
model=SentenceTransformer(settings['model'],revision=settings['revision'],device='cpu',
    config_kwargs={'vision_config':None,'audio_config':None},model_kwargs={'dtype':torch.float32})
loaded_ms=(time.perf_counter()-started)*1000
print(f'EmbeddingGemma ready after {loaded_ms:.0f}ms',flush=True)
app=FastAPI();lock=threading.Lock()
class EmbedRequest(BaseModel):
    kind:Literal['query','document']
    texts:list[str]=Field(min_length=1,max_length=32)
@app.get('/health')
def health():
    return {**settings,'loadedMs':loaded_ms,'parameters':sum(p.numel() for p in model.parameters()),'rssHighWaterBytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss}
@app.post('/embed')
def embed(body:EmbedRequest):
    prefix=settings['queryPrompt'] if body.kind=='query' else ''
    if any(not text.strip() or len(text)>4000 for text in body.texts):raise HTTPException(400,'Empty/oversized embedding input')
    if any(len(model.tokenizer(prefix+text,add_special_tokens=True)['input_ids'])>1024 for text in body.texts):raise HTTPException(400,'Prototype token budget exceeded; split explicitly')
    with lock:
        began=time.perf_counter()
        vectors=model.encode(body.texts,prompt=prefix,normalize_embeddings=True,convert_to_numpy=True,show_progress_bar=False,batch_size=8)
        return {'vectors':vectors.tolist(),'computeMs':(time.perf_counter()-began)*1000,'model':settings['model'],'revision':settings['revision'],'dimensions':vectors.shape[1]}
if __name__=='__main__':
    import uvicorn
    uvicorn.run(app,host='127.0.0.1',port=4332)

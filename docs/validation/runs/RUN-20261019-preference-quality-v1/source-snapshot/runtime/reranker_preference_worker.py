"""Pinned local cross-encoder experiment using the same bounded preference protocol."""
import os
os.environ['USE_TF']='0';os.environ['TOKENIZERS_PARALLELISM']='false'
import sys,json,time,contextlib,resource
from pathlib import Path
started=time.perf_counter()
with contextlib.redirect_stdout(sys.stderr):
 import torch
 torch.set_num_threads(4);torch.set_num_interop_threads(1)
 from transformers import AutoTokenizer,AutoModelForSequenceClassification
 from huggingface_hub import snapshot_download
 spec=json.loads(Path('runtime/preference-reranker-model.json').read_text())
 checkpoint=snapshot_download(spec['model'],revision=spec['revision'],local_files_only=True,allow_patterns=['config.json','model.safetensors','tokenizer.json','tokenizer_config.json','special_tokens_map.json','vocab.txt'])
 tokenizer=AutoTokenizer.from_pretrained(checkpoint,local_files_only=True)
 model=AutoModelForSequenceClassification.from_pretrained(checkpoint,local_files_only=True);model.eval()
print(json.dumps({'type':'ready','loadMs':(time.perf_counter()-started)*1000,'parameters':sum(p.numel() for p in model.parameters()),'weightsBytes':(Path(checkpoint)/'model.safetensors').stat().st_size,'peakRssBytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss}),flush=True)
for line in sys.stdin:
 request={}
 try:
  request=json.loads(line);assets=request['assets'];speech=request['speech']
  if not 1<=len(assets)<=5 or not isinstance(speech,str) or len(speech)>3000:raise ValueError('Preference input exceeds bounded menu')
  passages=[a['title']+': '+a['text'] for a in assets]
  began=time.perf_counter()
  features=tokenizer([speech]*len(assets),passages,padding=True,truncation=False,return_tensors='pt')
  if features['input_ids'].shape[1]>512:raise ValueError('Preference token budget exceeded')
  with torch.inference_mode():scores=model(**features).logits.flatten().tolist()
  selected=assets[max(range(len(scores)),key=lambda i:scores[i])]['id']
  result={'id':request['id'],'selected':selected,'computeMs':(time.perf_counter()-began)*1000,'peakRssBytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss}
 except Exception as error:result={'id':request.get('id'),'error':str(error)}
 print(json.dumps(result),flush=True)

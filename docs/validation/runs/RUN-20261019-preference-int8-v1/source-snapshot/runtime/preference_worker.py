"""Local preference worker; all options must be host-eligible."""
import os
os.environ['USE_TF']='0';os.environ['TOKENIZERS_PARALLELISM']='false'
import sys,json,time,contextlib,resource
from pathlib import Path
started=time.perf_counter()
with contextlib.redirect_stdout(sys.stderr):
 import torch
 torch.set_num_threads(4);torch.set_num_interop_threads(1)
 from huggingface_hub import snapshot_download
 from gliner2 import AutoExtractor
 checkpoint=snapshot_download('fastino/GLiNER2.5-Decide',revision='9d1bfb848cd16d93ee56ccbc59cd92bf0f284d90',local_files_only=True,allow_patterns=['*.json','encoder_config/*','model.safetensors'])
 model=AutoExtractor.from_pretrained(checkpoint,map_location='cpu',local_files_only=True);model.eval()
 if '--int8' in sys.argv:
  torch.backends.quantized.engine='qnnpack'
  model=torch.ao.quantization.quantize_dynamic(model,{torch.nn.Linear},dtype=torch.qint8)
print(json.dumps({'type':'ready','loadMs':(time.perf_counter()-started)*1000,'parameters':sum(p.numel() for p in model.parameters()),'weightsBytes':(Path(checkpoint)/'model.safetensors').stat().st_size,'peakRssBytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss}),flush=True)
for line in sys.stdin:
 request={}
 try:
  request=json.loads(line);assets=request['assets'];speech=request['speech']
  if not 1<=len(assets)<=5 or not isinstance(speech,str) or len(speech)>3000:raise ValueError('Preference input exceeds bounded menu')
  labels={f'option_{i}':f"{a['title']}: {a['text']}" for i,a in enumerate(assets)}
  prompt='Which prepared asset best matches the explanation? All options are already eligible. Select one.'
  # Conservatively reserve schema overhead; reject overflow rather than truncating differences.
  text=' '.join([speech,prompt,*labels,*labels.values()])
  tokens=len(model.processor.tokenizer(text,add_special_tokens=True)['input_ids'])
  if tokens+128>512:raise ValueError('Preference request exceeds conservative token budget')
  began=time.perf_counter()
  with contextlib.redirect_stdout(sys.stderr),torch.inference_mode():raw=model.classify_text(speech,{'asset':{'labels':labels,'prompt':prompt}},max_len=512)
  choice=raw.get('asset');index=int(choice.removeprefix('option_')) if isinstance(choice,str) and choice.startswith('option_') else -1
  if not 0<=index<len(assets):raise ValueError('Unknown preference output')
  result={'id':request['id'],'selected':assets[index]['id'],'computeMs':(time.perf_counter()-began)*1000,'peakRssBytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss}
 except Exception as error:result={'id':request.get('id'),'error':str(error)}
 print(json.dumps(result),flush=True)

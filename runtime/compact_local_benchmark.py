"""Isolated, pinned CPU decision screen; no production adapter/default changes."""
import os
os.environ['USE_TF']='0';os.environ['TOKENIZERS_PARALLELISM']='false'
import argparse,json,time,resource,platform,hashlib,urllib.request,sys
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('run');parser.add_argument('model',choices=['gliner-multi','gliner-english','laya-english']);parser.add_argument('--precision',choices=['fp32','fp16'],default='fp32');parser.add_argument('--codec',choices=['anonymous','semantic'],default='anonymous');args=parser.parse_args()
root=Path(args.run);inputs=json.loads((root/'inputs.json').read_text());model_specs={'gliner-multi':('fastino/GLiNER2.5-multi-Decide','e173bca1f0c4217d7a55b3b0c705d5ece8a0218d'),'gliner-english':('fastino/GLiNER2.5-Decide','9d1bfb848cd16d93ee56ccbc59cd92bf0f284d90'),'laya-english':('convaiinnovations/laya','7b928d828b7b0e022f929d9bd2e44165aa270148')}
name,revision=model_specs[args.model];key=f'{args.model}-{args.precision}'+('-semantic' if args.codec=='semantic' else '');target=root/f'{key}.json';rows=[];load_ms=None;model_bytes=None;parameters=None;weights_bytes=None
if target.exists():raise RuntimeError('Refusing to overwrite model report')
try:
 if args.model.startswith('gliner'):
  import torch
  torch.set_num_threads(4);torch.set_num_interop_threads(1)
  from huggingface_hub import snapshot_download
  from gliner2 import AutoExtractor
  checkpoint=snapshot_download(name,revision=revision,local_files_only=True,allow_patterns=['*.json','encoder_config/*','model.safetensors'])
  weights_bytes=(Path(checkpoint)/'model.safetensors').stat().st_size
  began=time.perf_counter();model=AutoExtractor.from_pretrained(checkpoint,map_location='cpu',local_files_only=True);model.eval()
  if args.precision=='fp16':model.quantize()
  load_ms=(time.perf_counter()-began)*1000;parameters=sum(p.numel() for p in model.parameters());model_bytes=sum(p.numel()*p.element_size() for p in model.parameters())
  print(json.dumps({'stage':'loaded','model':key,'loadMs':load_ms,'parameters':parameters,'parameterBytes':model_bytes}),flush=True)
 def run(case,iteration):
  assets=inputs['assets'][case['story']];offset=iteration%len(assets);ordered=assets[offset:]+assets[:offset]
  mapping={(asset['id'] if args.codec=='semantic' else f'option_{i}'):asset['id'] for i,asset in enumerate(ordered)}
  criteria={(a['id'] if args.codec=='semantic' else f'option_{i}'):f"{a['title']}: {a['text']} Entity {a['entity']}; {a['evidence']['provenance']}; {a['evidence']['timeframe'] or 'no date'}; {a['family']}." for i,a in enumerate(ordered)}
  criteria.update({'hold':inputs['hold'],'context':inputs['context']})
  labels=list(criteria);shift=iteration%len(labels);labels=labels[shift:]+labels[:shift];criteria={k:criteria[k] for k in labels}
  began=time.perf_counter()
  if args.model.startswith('gliner'):
   with torch.inference_mode():raw=model.classify_text(case['speech'],{'action':{'labels':criteria,'prompt':inputs['prompt']}},include_confidence=True)
   answer=raw.get('action');choice=answer if isinstance(answer,str) else answer.get('label') if isinstance(answer,dict) else None
  else:
   body=json.dumps({'state':{'speech':case['speech']},'questions':{'action':{'type':'choice','instructions':inputs['prompt'],'criteria':criteria}}}).encode()
   request=urllib.request.Request('http://127.0.0.1:4331/v1/systemone',data=body,headers={'Content-Type':'application/json'})
   with urllib.request.urlopen(request,timeout=15) as response:raw=json.load(response)
   choice=raw.get('answers',{}).get('action',{}).get('choice')
  if choice not in criteria:raise ValueError(f'Unknown model choice: {raw}')
  return {'choice':mapping.get(choice,choice),'raw':raw,'elapsedMs':(time.perf_counter()-began)*1000,'optionOrder':list(mapping.values()),'labelOrder':labels}
 # First-use forward separately reported; repeats are warm, no hidden warm-up cost.
 warm=run(inputs['cases'][0],0);print(json.dumps({'stage':'first-forward','model':key,'elapsedMs':warm['elapsedMs']}),flush=True)
 for iteration in range(inputs['passes']):
  for c in inputs['cases']:
   began=time.perf_counter();row={'id':c['id'],'pass':iteration,'model':key,'category':c['category'],'expected':c['expected'],'slice':c['slice']}
   try:row.update(run(c,iteration));row['correct']=row['choice']==c['expected']
   except Exception as e:row.update({'error':str(e),'elapsedMs':(time.perf_counter()-began)*1000,'correct':False})
   rows.append(row)
   with (root/f'{key}.jsonl').open('a') as stream:stream.write(json.dumps(row)+'\n')
  print(json.dumps({'stage':'pass','model':key,'pass':iteration,'correct':sum(r['correct'] for r in rows),'total':len(rows)}),flush=True)
 report={'model':name,'revision':revision,'precision':args.precision,'loadMs':load_ms,'parameterBytes':model_bytes,'parameters':parameters,'weightsFileBytes':weights_bytes,'firstForward':warm,'rows':rows}
except Exception as e:
 report={'model':name,'revision':revision,'precision':args.precision,'loadError':repr(e),'rows':rows};print(json.dumps({'stage':'failed','model':key,'error':repr(e)}),flush=True)
report.update({'profile':key,'codec':args.codec,'inputHash':hashlib.sha256((root/'inputs.json').read_bytes()).hexdigest(),'peakRssBytes':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss*(1 if sys.platform=='darwin' else 1024),'platform':platform.platform(),'python':sys.version,'threads':4,'scope':'Local CPU selection screen only; excludes retrieval, host guards, STT and paint.'})
if rows:
 times=sorted(r['elapsedMs'] for r in rows);n=len(rows);neg=[r for r in rows if r['category']!='positive'];pos=[r for r in rows if r['category']=='positive'];screen=inputs['precisionScreen']
 report['summary']={'total':n,'correct':sum(r['correct'] for r in rows),'errors':sum('error' in r for r in rows),'positiveCorrect':sum(r['correct'] for r in pos),'positiveTotal':len(pos),'negativeCorrect':sum(r['correct'] for r in neg),'negativeTotal':len(neg),'medianMs':times[(n-1)//2],'p95Ms':times[__import__('math').ceil(n*.95)-1],'orderStableCases':sum(len({r.get('choice',r.get('error')) for r in rows if r['id']==c['id']})==1 for c in inputs['cases'])}
 s=report['summary'];report['eligibleForPrecisionExperiment']=s['positiveCorrect']/len(pos)>=screen['minPositiveAccuracy'] and s['negativeCorrect']/len(neg)>=screen['minNegativeAccuracy'] and s['correct']/n>=screen['minOverallAccuracy'] and not s['errors']
else:report['eligibleForPrecisionExperiment']=False
report['productionAcceptance']=False;target.write_text(json.dumps(report,indent=2));print(json.dumps({k:report[k] for k in ['profile','summary','eligibleForPrecisionExperiment'] if k in report}),flush=True)

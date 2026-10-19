"""Three authored Piper utterances; actual PCM used by the speech-loop check."""
import json,wave,io,audioop,hashlib
from pathlib import Path
from piper import PiperVoice
root=Path('output/preference-audio');root.mkdir(exist_ok=False)
voice=PiperVoice.load('output/voices/en_US-ljspeech-high.onnx')
cases=[{'id':'explain','text':'Explain Solar panels turn sunlight into electricity.','expected':'show'}, {'id':'missing','text':'Show the installation cost.','expected':'context'}, {'id':'retain','text':'Keep this visual.','expected':'hold'}]
for c in cases:
 data=io.BytesIO()
 with wave.open(data,'wb') as wav:voice.synthesize_wav(c['text'],wav)
 with wave.open(io.BytesIO(data.getvalue()),'rb') as wav:audio,_=audioop.ratecv(wav.readframes(wav.getnframes()),2,1,wav.getframerate(),16000,None)
 c['speechSamples']=len(audio)//2;c['pcm']=c['id']+'.pcm';audio+=b'\x00'*96000
 (root/c['pcm']).write_bytes(audio);c['sha256']=hashlib.sha256(audio).hexdigest()
(root/'manifest.json').write_text(json.dumps({'voice':'en_US-ljspeech-high','sampleRate':16000,'cases':cases},indent=2))

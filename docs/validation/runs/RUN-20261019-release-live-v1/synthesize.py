import io,wave,audioop
from pathlib import Path
from piper import PiperVoice
voice=PiperVoice.load('output/voices/en_US-ljspeech-high.onnx')
texts=['Solar panels turn sunlight into electricity.','Batteries store electricity for later use.','Show the installation cost.']
root=Path('output/release-live')
for i,text in enumerate(texts):
 data=io.BytesIO()
 with wave.open(data,'wb') as wav:voice.synthesize_wav(text,wav)
 with wave.open(io.BytesIO(data.getvalue()),'rb') as wav:pcm,_=audioop.ratecv(wav.readframes(wav.getnframes()),2,1,wav.getframerate(),16000,None)
 pcm=b'\x00'*64000+pcm+b'\x00'*128000
 with wave.open(str(root/f'speech-{i}.wav'),'wb') as wav:
  wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(16000);wav.writeframes(pcm)

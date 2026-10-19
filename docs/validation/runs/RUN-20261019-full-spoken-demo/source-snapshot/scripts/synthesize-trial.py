"""Local Piper synthesis. Separate environment; never changes STT dependencies."""
import json, wave, io, audioop
from pathlib import Path
from piper import PiperVoice
root=Path('output/adaptive-trial')
voice=PiperVoice.load('output/voices/en_US-ljspeech-high.onnx')
manifest=json.loads((root/'manifest.json').read_text())
for variant in manifest['variants']:
    pcm=b''
    for text in variant['paragraphs']:
        data=io.BytesIO()
        with wave.open(data,'wb') as wav:
            voice.synthesize_wav(text,wav)
        with wave.open(io.BytesIO(data.getvalue()),'rb') as wav:
            audio=wav.readframes(wav.getnframes())
            resampled,_=audioop.ratecv(audio,2,1,wav.getframerate(),16000,None)
            pcm+=resampled+b'\x00'*96000  # three seconds of real silence for endpointing
    with wave.open(str(root/(variant['id']+'.wav')),'wb') as wav:
        wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(16000);wav.writeframes(pcm)
    print(variant['id'],round(len(pcm)/32000,1),'seconds',flush=True)

// Mono input, averaged downsampling to 16 kHz PCM16 in 250 ms frames.
class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.phase = 0;
    this.total = 0;
    this.count = 0;
    this.frame = [];
  }
  process(inputs) {
    const input = inputs[0]?.[0];
    if (input)
      for (const sample of input) {
        this.total += sample;
        this.count++;
        this.phase += 16000 / sampleRate;
        if (this.phase >= 1) {
          this.phase -= 1;
          const value = Math.max(-1, Math.min(1, this.total / this.count));
          this.frame.push(Math.round(value * (value < 0 ? 32768 : 32767)));
          this.total = 0;
          this.count = 0;
        }
        if (this.frame.length === 4000) {
          const pcm = new Int16Array(this.frame);
          this.port.postMessage(pcm.buffer, [pcm.buffer]);
          this.frame = [];
        }
      }
    return true;
  }
}
registerProcessor("pcm-capture", CaptureProcessor);

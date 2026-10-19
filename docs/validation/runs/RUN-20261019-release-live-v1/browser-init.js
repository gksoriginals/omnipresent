(() => {
 window.__live={events:[],sent:[],frames:0,captures:0};
 const Original=window.WebSocket;
 window.WebSocket=class extends Original {
  constructor(...args){super(...args);this.addEventListener('message',e=>{try{window.__live.events.push(JSON.parse(e.data));}catch{}});}
  send(data){if(typeof data==='string'){try{window.__live.sent.push(JSON.parse(data));}catch{}}else window.__live.frames++;super.send(data);}
 };
 navigator.mediaDevices.getUserMedia=async()=>{
  window.__live.captures++;
  const context=new AudioContext();
  const audio=await context.decodeAudioData(await (await fetch('/api/trial/generation-first.wav')).arrayBuffer());
  const source=context.createBufferSource();source.buffer=audio;
  const destination=context.createMediaStreamDestination();source.connect(destination);
  await context.resume();source.start();
  const stream=destination.stream;
  const track=stream.getTracks()[0],stop=track.stop.bind(track);
  track.stop=()=>{stop();void context.close();};
  return stream;
 };
})();

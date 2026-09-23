let context:AudioContext|undefined
export function chime(enabled:boolean,kind:'action'|'care'|'play'|'evolution'='action'){
  if(!enabled)return
  try{context??=new AudioContext();void context.resume().catch(()=>{});const notes=kind==='evolution'?[392,523,659,784]:kind==='care'?[523,659]:kind==='play'?[440,660]:[440]
    notes.forEach((hz,i)=>{const o=context!.createOscillator(),g=context!.createGain(),t=context!.currentTime+i*.1;o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.06,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g);g.connect(context!.destination);o.start(t);o.stop(t+.18)})
  }catch{/* Sound is optional. */}
}

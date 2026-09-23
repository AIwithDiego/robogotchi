// Web Locks releases ownership even after a crashed tab. Fallback is deliberately conservative.
export function claimTab(onChange:(owner:boolean,message?:string)=>void) {
  let stopped=false,release:(()=>void)|undefined,channel:BroadcastChannel|undefined,timer:ReturnType<typeof setTimeout>|undefined
  const id=crypto.randomUUID()
  onChange(false,'Connecting to your robot…')
  if(navigator.locks){
    queueMicrotask(()=>{if(stopped)return
    void navigator.locks.request('robogotchi-writer',{ifAvailable:true},async lock=>{
      if(stopped)return
      if(!lock){onChange(false,'Your robot is active in another tab. Close it, then take over here.');return}
      await new Promise<void>(resolve=>{release=resolve;onChange(true)})
    }).catch(()=>{if(!stopped)onChange(false,'Tab protection is unavailable. Try a current browser.')})
    })
  }else if(typeof BroadcastChannel!=='undefined'){
    channel=new BroadcastChannel('robogotchi-tab-presence')
    let collision=false
    channel.onmessage=e=>{if(e.data?.id===id)return;if(e.data?.type==='hello'){channel?.postMessage({id,type:'present'})}if(e.data?.type==='hello'||e.data?.type==='present'){collision=true;onChange(false,'Another tab was detected. Close the other game tabs and refresh this one.')}}
    channel.postMessage({id,type:'hello'})
    timer=setTimeout(()=>{if(!stopped&&!collision)onChange(true,'This browser uses conservative tab protection. Close other game tabs before playing.')},200)
  }else onChange(false,'This browser cannot protect your save across tabs. Try a current browser; the demo is still available.')
  return ()=>{stopped=true;release?.();channel?.close();if(timer)clearTimeout(timer)}
}

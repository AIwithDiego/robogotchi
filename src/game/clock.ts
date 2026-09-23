export function duration(ms:number,precise=false):string {
  const total=Math.max(0,Math.ceil(ms/1000)),d=Math.floor(total/86400),h=Math.floor(total/3600)%24,m=Math.floor(total/60)%60,s=total%60
  if(d)return `${d}d ${h}h`
  if(h)return `${h}h ${m}m`
  if(m)return precise?`${m}m ${s}s`:`${m}m`
  return `${s}s`
}
export function visibleClock(){let elapsed=0,last=performance.now();return {tick(visible:boolean){const now=performance.now();if(visible)elapsed+=now-last;last=now;return elapsed},reset(){elapsed=0;last=performance.now()}}}

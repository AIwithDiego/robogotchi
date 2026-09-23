import { useId } from 'react'
import type { CSSProperties } from 'react'
import { COLOURS } from '../game/personality'
import { routeOf } from '../game/evolution'
import { moodOf } from '../game/neglect'
import type { Activity, RobotSave } from '../game/types'

function ActivityArms({activity,torsoY,torsoW,headY,grown,fill,body,edge}:{activity:Activity;torsoY:number;torsoW:number;headY:number;grown:boolean;fill:string;body:string;edge:string}){
  const upper=grown?32:26,forearm=grown?30:24,reach=Math.hypot(18,upper)
  // Solve the sipping pose against the face, keeping it consistent across shapes/ages.
  const dx=190-(160+torsoW/2),dy=headY+88-(torsoY+18),restAngle=Math.atan2(upper,18)
  const elbow=Math.acos(Math.max(-1,Math.min(1,(dx*dx+dy*dy-reach*reach-forearm*forearm)/(2*reach*forearm))))
  const shoulder=Math.atan2(dy,dx)-Math.atan2(forearm*Math.sin(elbow),reach+forearm*Math.cos(elbow))
  const sipUpper=((shoulder-restAngle)*180/Math.PI+360)%360,sipForearm=(elbow+restAngle)*180/Math.PI-90
  const pose={'--sip-upper':`${sipUpper}deg`,'--sip-forearm':`${sipForearm}deg`,'--sip-counter':`${-sipUpper-sipForearm}deg`} as CSSProperties
  return <g className="activity-arms" style={pose}>{([-1,1] as const).map(side=><g key={side} className={side<0?'activity-left':'activity-right'} transform={`translate(${160+side*torsoW/2} ${torsoY+18})`}>
    <g className="activity-upper">
      <path d={`M0 0L${side*18} ${upper}`} fill="none" stroke={edge} strokeWidth={grown?19:16} strokeLinecap="round"/>
      <path d={`M0 0L${side*18} ${upper}`} fill="none" stroke={fill} strokeWidth={grown?13:11} strokeLinecap="round"/>
      <circle r={grown?10:8} fill={fill} stroke={edge} strokeWidth="2"/><circle r="3" fill={edge}/>
      <g transform={`translate(${side*18} ${upper})`}><g className="activity-forearm">
        <path d={`M0 0v${forearm}`} fill="none" stroke={edge} strokeWidth={grown?15:13} strokeLinecap="round"/>
        <path d={`M0 0v${forearm}`} fill="none" stroke={body} strokeWidth={grown?10:8} strokeLinecap="round"/>
        <circle r="7" fill={fill} stroke={edge} strokeWidth="2"/>
        <g className="activity-grip" transform={`translate(0 ${forearm})`}>
          {activity==='weights'&&<g className="held-prop dumbbell" stroke="#263e47" strokeWidth="2.5">
            <path d="M-22 0h44" strokeWidth="5"/><rect x="-24" y="-13" width="10" height="26" rx="3" fill="#677f91"/><rect x="14" y="-13" width="10" height="26" rx="3" fill="#677f91"/>
            <path d="M-20-8v16M18-8v16" stroke="#a7bbcb" strokeWidth="2"/>
          </g>}
          {activity==='coffee'&&side===1&&<g className="held-prop coffee-cup">
            <path d="M3-18q18-2 12 14H3" fill="none" stroke="#f3d7a5" strokeWidth="5"/>
            <rect x="-24" y="-24" width="29" height="28" rx="5" fill="#fff2d2" stroke="#8c795c" strokeWidth="2"/>
            <path d="M-19-21H0" stroke="#866346" strokeWidth="3" strokeLinecap="round"/>
            <path className="coffee-steam" d="M-11-31q-6-6 0-12t0-12" fill="none" stroke="#e5f1de" strokeWidth="3" strokeLinecap="round"/>
          </g>}
          <circle className="activity-hand" r={activity==='dance'?8:6} fill={fill} stroke={edge} strokeWidth="2"/>
          <path d="M-3-1h6M-3 2h6" stroke={edge} strokeWidth="1.5" strokeLinecap="round"/>
        </g>
      </g></g>
    </g>
  </g>)}</g>
}

export function Robot({state,small=false,reaction=''}:{state:RobotSave;small?:boolean;reaction?:string}) {
  const id=useId().replaceAll(':',''),stage=state.stage,route=routeOf(state)
  const adult=stage==='adult',evil=adult&&route==='overlord',guard=adult&&route==='guardian',friend=adult&&route==='companion'
  const grown=stage!=='bootling',proto=stage==='prototype',off=state.status!=='awake',low=state.meters.battery<25||state.meters.happiness<25
  const activity=['dance','weights','coffee'].includes(reaction)?reaction as Activity:null
  const palette=COLOURS[state.appearance.colour],shape=state.appearance.shape,accessory=state.appearance.accessory
  const rust=state.meters.rust,eye=off?'#344546':evil?'#ff8879':'#88f5df',body=palette.body,edge=palette.dark
  const headY=grown?63:86,headW=shape==='round'?142:shape==='boxy'?154:evil||guard?136:150,headX=(320-headW)/2,torsoY=headY+94,torsoW=shape==='round'?(grown?116:82):shape==='boxy'?(grown?112:78):evil?125:guard?120:friend?100:proto?96:grown?83:66,torsoH=grown?87:58,base=torsoY+torsoH,eyeY=headY+42
  return <svg className={`robot ${small?'robot-small':''} shape-${shape} ${off?'offline':''} ${reaction} ${rust>=40?'corroded':''}`} viewBox="0 0 320 340" role="img" aria-label={`${state.name}, ${stage}${route?' leaning '+route:''}, ${moodOf(state)}, ${Math.round(rust)} percent rust`}>
    <defs><linearGradient id={`${id}-body`} x1="0" y1="0" x2="1" y2="1"><stop stopColor={palette.light}/><stop offset=".5" stopColor={body}/><stop offset="1" stopColor={palette.dark}/></linearGradient><linearGradient id={`${id}-face`} x2="0" y2="1"><stop stopColor="#152729"/><stop offset="1" stopColor="#07171c"/></linearGradient><radialGradient id={`${id}-glow`}><stop stopColor={eye} stopOpacity=".55"/><stop offset="1" stopColor={eye} stopOpacity="0"/></radialGradient></defs>
    <ellipse cx="160" cy="317" rx={guard||evil?88:66} ry="12" fill="#000" opacity=".35"/><ellipse cx="160" cy="315" rx="48" ry="5" fill={eye} opacity={off?0:.12}/>
    <g className="robot-body"><g className="antenna"><path d={`M160 ${headY}v-23`} stroke={edge} strokeWidth="8"/><path d={`M160 ${headY-4}v-19`} stroke={body} strokeWidth="4"/><circle cx="160" cy={headY-27} r="8" fill={eye}/><circle cx="158" cy={headY-29} r="2" fill="#fff" opacity=".8"/>{!off&&<circle cx="160" cy={headY-27} r="18" fill={`url(#${id}-glow)`}/>}</g>
    <g className="legs" fill={`url(#${id}-body)`} stroke={edge} strokeWidth="2.5"><path d={`M${160-torsoW/3} ${base-7}v25l-9 10v9h31v-15l5-29Z`}/><path d={`M${160+torsoW/3} ${base-7}v25l9 10v9h-31v-15l-5-29Z`}/>{grown&&<path d={`M${160-torsoW/3-3} ${base+10}h22M${160+torsoW/3-19} ${base+10}h22`} stroke="#30484b" strokeWidth="6"/>}</g>
    {!activity&&<><g className="left-arm" stroke={edge} strokeWidth="2.5" fill={`url(#${id}-body)`}><path d={evil||guard?`M${160-torsoW/2+4} ${torsoY+5}l-30-8-14 17 6 44 25 5 6-28Z`:`M${160-torsoW/2} ${torsoY+12}q-22 2-22 25l-4 14 13 6 8-13 11-10Z`}/><path d={`M${160-torsoW/2-20} ${torsoY+49}v15l7 8 7-6`} fill="none" stroke={body} strokeWidth="8"/></g>
    <g className="right-arm" stroke={edge} strokeWidth="2.5" fill={`url(#${id}-body)`}><path d={evil||guard?`M${160+torsoW/2-4} ${torsoY+5}l30-8 14 17-6 44-25 5-6-28Z`:`M${160+torsoW/2} ${torsoY+12}q22 2 22 25l4 14-13 6-8-13-11-10Z`}/><path d={`M${160+torsoW/2+20} ${torsoY+49}v15l-7 8-7-6`} fill="none" stroke={body} strokeWidth="8"/></g></>}
    <g className="torso">{shape==='classic'?<path d={`M${160-torsoW/2+12} ${torsoY}H${160+torsoW/2-12}l12 13-7 ${torsoH-23}-15 10h-${torsoW-44}l-15-10-7-${torsoH-23}Z`} fill={`url(#${id}-body)`} stroke={edge} strokeWidth="2.5"/>:<rect x={160-torsoW/2} y={torsoY} width={torsoW} height={torsoH} rx={shape==='round'?torsoH/2:8} fill={`url(#${id}-body)`} stroke={edge} strokeWidth="2.5"/>}<path d={`M${160-torsoW/2+12} ${torsoY+12}h${torsoW-24}`} stroke="#fff" opacity=".32" strokeWidth="3"/><circle cx="160" cy={torsoY+torsoH*.47} r={grown?22:17} fill="#243e40" stroke={edge} strokeWidth="3"/><circle className="core" cx="160" cy={torsoY+torsoH*.47} r={grown?14:10} fill={eye}/><circle cx="160" cy={torsoY+torsoH*.47} r={grown?24:18} fill={`url(#${id}-glow)`}/>{friend&&<path d={`m160 ${torsoY+47}-8-8q-5-8 3-8l5 4 5-4q8 0 3 8Z`} fill="#f1fff7"/>}<path d={`M150 ${base-10}h20`} stroke={edge} strokeWidth="3" strokeLinecap="round"/>{proto&&route&&<path d={`M${160-torsoW/2+9} ${torsoY+25}v23`} stroke={route==='overlord'?'#ee7965':route==='guardian'?'#5a9fc9':'#80dabb'} strokeWidth="5"/>}</g>
    <g className="head"><rect x={headX-8} y={headY+29} width="12" height="32" rx="5" fill={edge}/><rect x={headX+headW-4} y={headY+29} width="12" height="32" rx="5" fill={edge}/><rect x={headX} y={headY} width={headW} height="93" rx={shape==='round'?44:shape==='boxy'?7:22} fill={`url(#${id}-body)`} stroke={edge} strokeWidth="2.5"/><path d={`M${headX+23} ${headY+7}h${headW-46}`} stroke="#fff" strokeOpacity=".55" strokeWidth="3" strokeLinecap="round"/><rect x={headX+11} y={headY+17} width={headW-22} height="59" rx={shape==='boxy'?5:evil?9:18} fill={`url(#${id}-face)`} stroke="#829c90" strokeWidth="2"/><path d={`M${headX+23} ${headY+23}h${headW-47}`} stroke="#b2e6d9" strokeOpacity=".12" strokeWidth="2" strokeLinecap="round"/>
    <g className="eyes" fill={eye}>{evil?<><path d={`m126 ${eyeY-6} 25 6v7h-23Z`}/><path d={`m194 ${eyeY-6}-25 6v7h23Z`}/></>:off||low?<path d={`M124 ${eyeY+4}h20M176 ${eyeY+4}h20`} stroke={eye} strokeWidth="5" strokeLinecap="round"/>:<><rect x="124" y={eyeY-9} width="19" height="26" rx="8"/><rect x="177" y={eyeY-9} width="19" height="26" rx="8"/><circle cx="130" cy={eyeY-2} r="3" fill="#fff"/><circle cx="183" cy={eyeY-2} r="3" fill="#fff"/></>}</g><path d={off?`M154 ${eyeY+23}h12`:evil?`m153 ${eyeY+24} 14-3`:low?`m153 ${eyeY+25}q7-6 14 0`:`m153 ${eyeY+22}q7 7 14 0`} fill="none" stroke={eye} strokeWidth="2.5" strokeLinecap="round"/><circle cx={headX+12} cy={headY+82} r="2" fill={edge}/><circle cx={headX+headW-12} cy={headY+82} r="2" fill={edge}/></g>
    {accessory==='bow'&&<g fill="#ee93ab" stroke="#97556e" strokeWidth="2"><path d={`m160 ${torsoY+9}-18-9v20l18-8 18 8v-20Z`}/><circle cx="160" cy={torsoY+10} r="5"/></g>}
    {accessory==='headphones'&&<g fill="#d4bff3" stroke="#5d507b" strokeWidth="5"><path d={`M${headX-3} ${headY+49}v-14q0-47 79-47t79 47v14`} fill="none"/><rect x={headX-11} y={headY+30} width="15" height="32" rx="5"/><rect x={headX+headW-4} y={headY+30} width="15" height="32" rx="5"/></g>}
    {accessory==='crown'&&<path d={`m125 ${headY-7}-5-28 22 14 18-21 18 21 22-14-5 28Z`} fill="#f7ce72" stroke="#a67d35" strokeWidth="3"/>}
    {rust>=20&&<g className="rust-overlay" fill="#b56937" stroke="#dc9453" strokeWidth="1" opacity=".85"><path d={`m${headX+2} ${headY+26} 13 4-5 13 5 6-13 6Z`}/><path d={`m${160+torsoW/2-15} ${torsoY+39} 14-5-4 19-10 6-5-8Z`}/><circle cx={headX+headW-12} cy={headY+83} r="5"/>{rust>=40&&<><path d={`m${headX+headW-25} ${headY+1} 22 6-2 16-12-7-5 4-10-12Z`}/><path d={`m${160-torsoW/2} ${torsoY+12} 19-3 6 10-11 7-7-5-8 7Z`}/><circle cx="145" cy={base-7} r="7"/></>}{rust>=70&&<><path d={`m${headX+20} ${headY+84} 38-5 12 8-5 7-35-2Z`}/><path d={`m169 ${torsoY+16} 19-5 9 12-6 8-12-3Z`}/><circle cx={160+torsoW/2+13} cy={torsoY+25} r="9"/></>}</g>}
    {state.wear>0&&<g stroke="#7a8077" opacity=".6" strokeWidth="2"><path d={`m${headX+headW-25} ${headY+6}-7 8m11-6-5 7M${160-torsoW/2+9} ${torsoY+39}l9-6`}/></g>}
    {activity&&<ActivityArms activity={activity} torsoY={torsoY} torsoW={torsoW} headY={headY} grown={grown} fill={`url(#${id}-body)`} body={body} edge={edge}/>}
    {state.meters.heat>=85&&<g className="steam" fill="none" stroke="#d8ebd8" strokeWidth="3" opacity=".5"><path d={`M105 ${headY-3}q-12-10 0-20t0-20M211 ${headY-3}q-12-10 0-20t0-20`}/></g>}
    </g></svg>
}

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { Icon } from './Icon'
export function Dialog({title,children,onClose}:{title:string;children:ReactNode;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null)
 const returnFocus=useRef(document.activeElement instanceof HTMLElement?document.activeElement:null)
 useEffect(()=>{const el=ref.current!,opener=returnFocus.current;el.showModal();return()=>{el.close();(opener?.isConnected?opener:document.querySelector<HTMLElement>('main button:not(:disabled)'))?.focus({preventScroll:true})}},[])
 return <dialog ref={ref} className="dialog" aria-labelledby="dialog-title" onCancel={onClose} onClick={e=>{if(e.target===ref.current){const r=ref.current.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)onClose()}}}><div className="dialog-heading"><h2 id="dialog-title">{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close"/></button></div>{children}</dialog>
}

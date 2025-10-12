"use client";
import { useRef, useState } from "react";

export default function OnboardingModal({ open, onClose }:{open:boolean; onClose:()=>void;}){
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<{role:"user"|"assistant"; text:string}[]>([
    { role:"assistant", text:"Muraho! Send your WhatsApp (07xx…) and MoMo (078x…). Optional." }
  ]);
  if(!open) return null;
  const send = ()=>{
    const t = inputRef.current?.value?.trim(); if(!t) return;
    inputRef.current!.value = ""; setMessages(m=>[...m,{role:"user",text:t}]);
    setTimeout(()=>setMessages(m=>[...m,{role:"assistant",text:"Murakoze! We’ll keep it on your profile. (Optional)"}]),600);
  };
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg card">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Optional Onboarding</h3>
          <button className="btn" onClick={onClose} aria-label="Close">✖</button>
        </div>
        <div className="space-y-2 max-h-72 overflow-auto">
          {messages.map((m,i)=>(
            <div key={i} className={m.role==="user"?"text-right":"text-left"}>
              <span className={"inline-block px-3 py-2 rounded-xl " + (m.role==="user"?"bg-blue-500/20":"bg-white/10")}>{m.text}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <input ref={inputRef} placeholder="Type your message…" className="flex-1 px-3 py-2 rounded-xl bg-black/25 outline-none" />
          <button className="btn-primary" onClick={send}>Send</button>
        </div>
        <p className="muted text-xs mt-2">Sharing WhatsApp/MoMo is optional. You can do it later.</p>
      </div>
    </div>
  );
}


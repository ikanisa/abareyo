"use client";
import { useEffect, useRef, useState } from "react";

type ChatState = "loading" | "ready" | "error";
export default function OnboardingChat(){
  const [state, setState] = useState<ChatState>("loading");
  const [messages, setMessages] = useState<{role:"user"|"assistant";text:string}[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    const t = setTimeout(()=> setState("ready"), 900);
    return ()=>clearTimeout(t);
  },[]);

  const send = ()=>{
    const text = inputRef.current?.value?.trim();
    if(!text) return;
    inputRef.current!.value = "";
    setMessages(m => [...m, {role:"user", text}]);
    setTimeout(()=>{
      setMessages(m => [...m, {role:"assistant", text: "Thank you! We’ll verify your numbers and set up your profile."}]);
    }, 600);
  };

  if (state === "loading"){
    return (
      <div className="card break-words whitespace-normal break-words whitespace-normal">
        <div className="animate-pulse h-6 w-40 bg-white/10 rounded mb-3" />
        <div className="animate-pulse h-4 w-full bg-white/10 rounded mb-2" />
        <div className="animate-pulse h-4 w-11/12 bg-white/10 rounded" />
        <p className="muted mt-3">Warming up the chat…</p>
      </div>
    );
  }

  if (state === "error"){
    return (
      <div className="card break-words whitespace-normal break-words whitespace-normal border-red-400/40">
        <p className="text-red-300 font-medium mb-2">We couldn’t start the onboarding chat.</p>
        <button className="btn" onClick={()=>setState("loading")}>Retry</button>
      </div>
    );
  }

  return (
    <div className="card break-words whitespace-normal break-words whitespace-normal">
      <div className="muted mb-2">Anonymous session — powered by OpenAI Agents</div>
      <div className="flex flex-col gap-2 max-h-72 overflow-auto">
        {messages.length===0 && (
          <p className="muted">Hi! Send your WhatsApp (07xx…) and your MoMo (078x…).</p>
        )}
        {messages.map((m, i)=>(
          <div key={i} className={m.role==="user"?"text-right":"text-left"}>
            <span className={"inline-block px-3 py-2 rounded-xl " + (m.role==="user"?"bg-blue-500/20":"bg-white/10")}>
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input ref={inputRef} className="flex-1 px-3 py-2 rounded-xl bg-black/25 outline-none" placeholder="Type your message…" />
        <button onClick={send} className="btn-primary">Send</button>
      </div>
      <p className="muted text-xs mt-2">We only use your numbers to set up your profile.</p>
    </div>
  );
}


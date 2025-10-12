"use client";
import { useEffect, useState } from "react";

export function InstallPrompt(){
  const [evt, setEvt] = useState<any>(null);
  const [show, setShow] = useState(false);
  useEffect(()=>{
    const onBeforeInstallPrompt = (e:any)=>{ e.preventDefault(); setEvt(e); setShow(true); };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    return ()=>window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  },[]);
  if(!show) return null;
  return (
    <div className="fixed bottom-4 inset-x-0 mx-auto w-fit card flex items-center gap-2">
      <span>Install Abareyo?</span>
      <button className="btn-primary" onClick={()=>{ evt?.prompt(); setShow(false); }}>Install</button>
      <button className="btn" onClick={()=>setShow(false)}>Later</button>
    </div>
  );
}

export function OfflineBanner(){
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(()=>{
    const on = ()=>setOffline(false), off=()=>setOffline(true);
    window.addEventListener("online", on); window.addEventListener("offline", off);
    return ()=>{ window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  },[]);
  if(!offline) return null;
  return <div className="fixed top-14 inset-x-0 text-center p-2 bg-yellow-500/20 text-yellow-100">You’re offline. We’ll sync when you’re back.</div>;
}


'use client'
import { useEffect, useState } from 'react';
type Flags = Record<string, boolean>;
export default function useFlags(defaults: Flags = {}){
  const [flags,setFlags] = useState<Flags>(defaults);
  useEffect(()=>{ (async()=>{
    try{
      const r = await fetch('/api/flags').then(x=>x.json()).catch(()=>({flags:defaults}));
      setFlags({ ...defaults, ...(r?.flags||{}) });
    }catch{ setFlags(defaults); }
  })(); },[]);
  return flags;
}

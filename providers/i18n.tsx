"use client";
import { createContext, useContext, useState, type ReactNode } from 'react';
const Strings = { en:{ buy:'Buy', pay:'Pay', redeem:'Redeem' }, rw:{ buy:'Gura', pay:'Ishura', redeem:'Kubikuza' } };
const Ctx = createContext<{lang:'en'|'rw'; t:(k:keyof typeof Strings['en'], fallback?:string)=>string}>({lang:'rw', t:()=>''});
export function I18nProvider({children}:{children:ReactNode}){
  const [lang, setLang] = useState<'en'|'rw'>('rw');
  const t = (key: keyof typeof Strings['en'], fallback?: string) => Strings[lang]?.[key] || fallback || key;
  return <Ctx.Provider value={{lang,t}}>{children}</Ctx.Provider>;
}
export function useT(){ return useContext(Ctx); }

'use client'
import { useMemo } from 'react';

import { UssdOnlyNotice } from '@/components/payments/UssdOnlyNotice';
import { buildUssd, isIOS, type Provider } from '@/lib/ussd';

export default function UssdPayButton({
  amount, phone, provider='mtn', block=true, onCopy
}:{
  amount:number; phone?:string; provider?:Provider; block?:boolean; onCopy?:()=>void;
}){
  const href = useMemo(()=>buildUssd({ amount, phone, provider }),[amount, phone, provider]);
  const ios = isIOS();

  const classes = (primary:boolean)=> primary
    ? "btn-primary "+(block?"w-full inline-block text-center":"")
    : "btn "+(block?"w-full inline-block text-center":"");

  return (
    <div className="space-y-3">
      <a className={classes(true)} href={href} aria-label="Pay via USSD">
        Pay via USSD
      </a>
      {ios && (
        <button
          type="button"
          className={classes(false)}
          onClick={()=>{
            const raw = href.replace(/^tel:/,'').replace(/%23/g,'#');
            navigator.clipboard?.writeText(raw); onCopy?.();
          }}
        >
          Copy USSD (iOS)
        </button>
      )}
      <UssdOnlyNotice className="text-left text-xs" />
    </div>
  );
}

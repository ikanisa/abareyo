'use client'
import { buildUssd, isIOS, type Provider } from '@/lib/ussd';
import { useMemo } from 'react';

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
    <div className="space-y-2">
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
      <p className="muted text-xs">
        Dial launches your Mobile Money menu. If nothing happens on iOS, use “Copy USSD” and paste in the Phone app.
      </p>
    </div>
  );
}

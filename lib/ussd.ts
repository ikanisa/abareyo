export type Provider = 'mtn'|'airtel';
export function buildUssd({ amount, phone, provider='mtn' }:{ amount:number; phone?:string; provider?:Provider }){
  // Patterns may vary; keep MVP simple. Let admin change templates later if needed.
  const sanitized = String(amount|0);
  const p = phone?.replace(/\D/g,'') || '07xxxxxxx';
  // Both MTN/Airtel shown as *182*1*1*, differing by actual SIM only; we keep a single pattern to avoid confusion.
  const code = `*182*1*1*${p}*${sanitized}#`;
  // Encode for tel: link
  return `tel:${code.replace(/#/g,'%23')}`;
}
export function isIOS(){
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}
export function launchUssdDialer(
  ussdCode: string,
  options?: { onFallback?: () => void },
){
  if (!ussdCode) {
    return;
  }
  const telUrl = ussdCode.startsWith('tel:') ? ussdCode : `tel:${ussdCode}`;
  const anchor = document.createElement('a');
  anchor.href = telUrl;
  anchor.style.display = 'none';
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (isIOS()) {
    window.setTimeout(() => {
      options?.onFallback?.();
    }, 700);
  }
}

const StadiumMap = () => (
  <svg
    aria-hidden
    viewBox="0 0 320 200"
    className="h-40 w-full"
    role="img"
    focusable="false"
  >
    <defs>
      <linearGradient id="stadium-shell" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(0,51,255,0.4)" />
        <stop offset="100%" stopColor="rgba(0,161,222,0.25)" />
      </linearGradient>
      <linearGradient id="stadium-field" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(32,96,61,0.9)" />
        <stop offset="100%" stopColor="rgba(0,161,222,0.8)" />
      </linearGradient>
    </defs>
    <rect x="8" y="16" width="304" height="168" rx="52" fill="url(#stadium-shell)" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
    <rect x="48" y="48" width="224" height="120" rx="36" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
    <rect x="84" y="74" width="152" height="68" rx="24" fill="url(#stadium-field)" />
    <rect x="134" y="90" width="52" height="36" rx="12" fill="rgba(255,255,255,0.2)" />
    <line x1="160" y1="74" x2="160" y2="142" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeDasharray="6 6" />
    <circle cx="160" cy="108" r="10" fill="rgba(255,255,255,0.8)" />
    <circle cx="104" cy="108" r="16" fill="rgba(0,51,255,0.55)" />
    <circle cx="216" cy="108" r="16" fill="rgba(250,210,1,0.7)" />
  </svg>
);

export default StadiumMap;

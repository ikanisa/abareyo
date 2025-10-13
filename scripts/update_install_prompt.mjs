import fs from "fs";

// Path to the PWA helpers component
const file = "app/_components/pwa/PwaHelpers.tsx";

if (!fs.existsSync(file)) {
  console.error("Cannot find", file);
  process.exit(1);
}

let src = fs.readFileSync(file, "utf8");

// 1. Add mobile install logic if not present already
if (!src.includes("showIosPrompt")) {
  // Add iOS prompt state after deferredPrompt state
  src = src.replace(
    /const \\[deferredPrompt, setDeferredPrompt\\]/,
    match => `const [showIosPrompt, setShowIosPrompt] = useState(false);\n  ${match}`
  );

  // Add useEffect block to detect iOS Safari
  src = src.replace(
    /useEffect\\(\\(\\) => \\{/,
    match => `${match}
    // Detect iOS Safari (no beforeinstallprompt) and show guidance
    useEffect(() => {
      if (!hasWindow()) return;
      const ua = window.navigator.userAgent.toLowerCase();
      const isiOS = /iphone|ipad|ipod/.test(ua);
      const inStandalone = ('standalone' in window.navigator) && window.navigator.standalone;
      if (isiOS && !inStandalone) {
        setShowIosPrompt(true);
      }
    }, []);
    `
  );

  // Ensure we don't hide the prompt when showIosPrompt is true
  src = src.replace(/if \\(!show\\) \\{/g, "if (!show && !showIosPrompt) {");

  // Insert conditional return block before the default return
  src = src.replace(
    /return \\(/,
    `if (showIosPrompt) {
    return (
      <div className="card fixed inset-x-0 bottom-24 mx-auto flex w-fit items-center gap-2">
        <span>Install GIKUNDIRO App to your Home Screen</span>
        {/* Tell iOS users how to add to home screen */}
        <p className="text-xs text-white/70">Tap the Share icon and select “Add to Home Screen”.</p>
        <button className="btn" onClick={() => setShowIosPrompt(false)}>Close</button>
      </div>
    );
  }
  return (`
  );
}

// 2. Replace all occurrences of Install Abareyo? with Install GIKUNDIRO App?
src = src.replace(/Install Abareyo\\?/g, "Install GIKUNDIRO App?");

// Write the file back
fs.writeFileSync(file, src);
console.log("PwaHelpers.tsx updated with mobile install guidance.");


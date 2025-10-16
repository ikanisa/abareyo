import { isIOS as detectIOS } from "../../lib/ussd";

export * from "../../lib/ussd";

export const launchUssdDialer = (
  ussdCode: string,
  options?: { onFallback?: () => void },
) => {
  if (!ussdCode) {
    return;
  }

  const telUrl = ussdCode.startsWith("tel:") ? ussdCode : `tel:${ussdCode}`;
  const anchor = document.createElement("a");
  anchor.href = telUrl;
  anchor.style.display = "none";
  anchor.rel = "noopener noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (detectIOS()) {
    window.setTimeout(() => {
      options?.onFallback?.();
    }, 700);
  }
};

"use client";
import { useEffect, useMemo, useRef, useState } from "react";

type ChatState = "idle" | "starting" | "ready" | "error";

async function postJSON(url: string, body: any) {
  const token = process.env.NEXT_PUBLIC_ONBOARDING_PUBLIC_TOKEN || "";
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  const text = await r.text();
  let json: any = {};
  try { json = JSON.parse(text); } catch { /* ignore */ }
  return { ok: r.ok, status: r.status, json, raw: text };
}

export default function OnboardingChat() {
  const [state, setState] = useState<ChatState>("starting");
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{role:"user"|"assistant"; text:string}[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      setState("starting");
      setError(null);
      const r = await postJSON("/api/onboarding/sessions", {});
      if (!r.ok) {
        // Friendly mapped errors
        if (r.status === 401) setError("Unauthorized: server token missing. Contact admin.");
        else if (r.status === 503) setError("Service not ready. Please try again later.");
        else setError("Couldn’t start chat. Tap retry.");
        setState("error");
        return;
      }
      setSessionId(r.json.session?.sessionId);
      setState("ready");
    })();
  }, []);

  const send = async () => {
    if (!sessionId) return;
    const text = inputRef.current?.value?.trim();
    if (!text) return;
    setMessages(m => [...m, { role: "user", text }]);
    inputRef.current!.value = "";
    const r = await postJSON("/api/onboarding/message", { sessionId, text });
    if (!r.ok) {
      setMessages(m => [...m, { role: "assistant", text: "Sorry, the server is busy. Try again in a moment." }]);
      return;
    }
    setMessages(m => [...m, { role: "assistant", text: r.json.reply ?? "Okay!" }]);
  };

  const retry = () => {
    location.reload();
  };

  // Fallback UI layers
  if (state === "starting") {
    return (
      <div className="rounded-xl p-4 bg-white/5 border border-white/10">
        <div className="animate-pulse h-6 w-40 bg-white/10 rounded mb-3" />
        <div className="animate-pulse h-4 w-full bg-white/10 rounded mb-2" />
        <div className="animate-pulse h-4 w-11/12 bg-white/10 rounded" />
        <p className="text-sm text-white/60 mt-3">Warming up the chat…</p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/30">
        <p className="text-red-300 font-medium mb-2">We couldn’t start the onboarding chat.</p>
        <p className="text-red-200/80 text-sm mb-3">{error ?? "Please try again."}</p>
        <button onClick={retry} className="px-3 py-2 rounded bg-white/10 hover:bg-white/20">Retry</button>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 bg-white/5 border border-white/10">
      <div className="flex flex-col gap-2 max-h-64 overflow-auto">
        {messages.length === 0 && (
          <p className="text-white/70">Muraho! Tell me your WhatsApp number so we can set up your fan profile.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span className={"inline-block px-3 py-2 rounded-lg " + (m.role === "user" ? "bg-blue-500/20" : "bg-white/10")}>
              {m.text}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input ref={inputRef} placeholder="Type your message…" className="flex-1 px-3 py-2 rounded bg-black/20 outline-none" />
        <button onClick={send} className="px-3 py-2 rounded bg-blue-500/80 hover:bg-blue-500">Send</button>
      </div>
    </div>
  );
}


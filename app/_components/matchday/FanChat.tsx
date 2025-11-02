"use client";
import type { FormEvent } from "react";

import { useEffect, useRef, useState } from "react";

const slowModeDuration = 6000;

type Message = {
  id: string;
  user: string;
  text: string;
  timestamp: string;
};

type FanChatProps = {
  roomId: string;
};

const initialMessages: Message[] = [
  {
    id: "1",
    user: "Chantal",
    text: "Rayon pressing so well today!",
    timestamp: "18:42",
  },
  {
    id: "2",
    user: "Junior",
    text: "That save from Ndizeye 🔥",
    timestamp: "18:44",
  },
];

const FanChat = ({ roomId }: FanChatProps) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSlowMode, setIsSlowMode] = useState(false);
  const [moderationQueue, setModerationQueue] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    },
    [],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isSlowMode) {
      return;
    }

    const nextMessage: Message = {
      id: `${Date.now()}`,
      user: "You",
      text: input.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, nextMessage]);
    setInput("");
    setIsSlowMode(true);

    timeoutRef.current = setTimeout(() => {
      setIsSlowMode(false);
    }, slowModeDuration);
  };

  const handleReport = (messageId: string) => {
    setModerationQueue((prev) => Array.from(new Set([...prev, messageId])));
  };

  return (
    <section className="flex h-[24rem] flex-col rounded-3xl bg-slate-900/70 p-4 text-white">
      <header className="mb-3 flex items-center justify-between text-sm">
        <div>
          <p className="font-semibold">Live fan chat</p>
          <p className="text-xs text-white/60">
            Slow mode active • {slowModeDuration / 1000}s between messages
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
          Room {roomId}
        </span>
      </header>

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 space-y-2 overflow-y-auto rounded-2xl bg-black/40 p-3 text-sm"
      >
        {messages.map((message) => (
          <article
            key={message.id}
            className="rounded-2xl bg-white/5 p-3"
            aria-label={`${message.user} at ${message.timestamp}`}
          >
            <div className="flex items-center justify-between text-xs text-white/60">
              <span className="font-semibold text-white">{message.user}</span>
              <span>{message.timestamp}</span>
            </div>
            <p className="mt-1 text-white/90">{message.text}</p>
            <div className="mt-2 flex items-center justify-between text-xs text-white/50">
              <button
                type="button"
                onClick={() => handleReport(message.id)}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 transition hover:bg-white/20"
              >
                Report
              </button>
              {moderationQueue.includes(message.id) ? (
                <span className="text-[0.65rem] uppercase tracking-wide text-amber-300">
                  Flagged for review
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <label htmlFor="chat-message" className="sr-only">
          Send a message
        </label>
        <input
          id="chat-message"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
          placeholder="Share your take..."
          maxLength={160}
        />
        <button
          type="submit"
          disabled={isSlowMode}
          className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition disabled:cursor-not-allowed disabled:bg-white/20"
        >
          {isSlowMode ? "Cooling" : "Send"}
        </button>
      </form>
    </section>
  );
};

export default FanChat;

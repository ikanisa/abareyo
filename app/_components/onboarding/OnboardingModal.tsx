"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; text: string };

type OnboardingModalProps = {
  open: boolean;
  onClose: () => void;
};

const initialMessages: ChatMessage[] = [
  { role: "assistant", text: "Muraho! Send your WhatsApp (07xx…) and MoMo (078x…). Optional." },
];

const composeReply = (text: string) =>
  text.trim() ? { role: "assistant" as const, text: "Murakoze! We’ll keep it on your profile. (Optional)" } : null;

export default function OnboardingModal({ open, onClose }: OnboardingModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [...initialMessages]);
  const replyTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setMessages([...initialMessages]);
    inputRef.current?.focus();

    if (replyTimeoutRef.current) {
      clearTimeout(replyTimeoutRef.current);
      replyTimeoutRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (replyTimeoutRef.current) {
        clearTimeout(replyTimeoutRef.current);
        replyTimeoutRef.current = null;
      }
    };
  }, []);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onClose();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = inputRef.current?.value?.trim();
    if (!value) {
      return;
    }

    inputRef.current.value = "";
    setMessages((prev) => [...prev, { role: "user", text: value }]);
    const reply = composeReply(value);
    if (!reply) {
      return;
    }

    if (replyTimeoutRef.current) {
      clearTimeout(replyTimeoutRef.current);
    }

    replyTimeoutRef.current = window.setTimeout(() => {
      setMessages((prev) => [...prev, reply]);
      replyTimeoutRef.current = null;
    }, 600);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <Dialog.Content className="card fixed inset-x-4 top-1/2 z-50 mx-auto w-auto max-w-lg -translate-y-1/2 space-y-4 p-6 focus:outline-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-white">Optional Onboarding</Dialog.Title>
              <Dialog.Description className="muted text-sm">
                Share contact details now or come back later. We’ll only use this to personalise your experience.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button className="btn" aria-label="Close onboarding">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="max-h-72 space-y-2 overflow-auto pr-1" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={message.role === "user" ? "text-right" : "text-left"}>
                <span
                  className={`inline-block rounded-xl px-3 py-2 ${
                    message.role === "user" ? "bg-blue-500/20" : "bg-white/10"
                  }`}
                >
                  {message.text}
                </span>
              </div>
            ))}
          </div>

          <form className="mt-2 flex gap-2" onSubmit={handleSubmit}>
            <label htmlFor="onboarding-message" className="sr-only">
              Share optional contact information
            </label>
            <input
              ref={inputRef}
              id="onboarding-message"
              placeholder="Type your message…"
              className="flex-1 rounded-xl bg-black/25 px-3 py-2 text-white outline-none"
            />
            <button type="submit" className="btn-primary">
              Send
            </button>
          </form>

          <p className="muted text-xs">
            Sharing WhatsApp/MoMo is optional. You can update it later in your profile.
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

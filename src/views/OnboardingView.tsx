"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, RefreshCw, Send, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { startOnboardingSession, fetchOnboardingSession, sendOnboardingMessage, type OnboardingMessageDto, type OnboardingSessionDto } from '@/lib/api/onboarding';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import WhatsAppLoginNotice from '@/app/_components/auth/WhatsAppLoginNotice';
import { useAuth } from '@/providers/auth-provider';
import { useToast } from '@/components/ui/use-toast';

const SESSION_ID_KEY = 'onboarding:sessionId';

type SessionStatusCopy = {
  label: string;
  tone: 'pending' | 'partial' | 'done';
};

const STATUS_COPY: Record<OnboardingSessionDto['status'], SessionStatusCopy> = {
  collecting_profile: { label: 'Need WhatsApp and MoMo', tone: 'pending' },
  awaiting_confirmation: { label: 'Almost there', tone: 'partial' },
  completed: { label: 'Onboarding complete', tone: 'done' },
};

const ChatBubble = ({ message }: { message: OnboardingMessageDto }) => {
  if (message.kind === 'tool_call') {
    return null;
  }

  if (message.kind === 'tool_result') {
    const entries = Object.entries(message.payload ?? {}).filter(([, value]) => typeof value === 'string');
    if (entries.length === 0) {
      return null;
    }

    return (
      <div className="flex justify-center">
        <div className="rounded-full bg-primary/10 px-4 py-2 text-xs text-primary">
          Saved: {entries.map(([key, value]) => `${formatKey(key)} ${value}`).join(' • ')}
        </div>
      </div>
    );
  }

  const isUser = message.role === 'user';
  const Icon = isUser ? UserRound : Bot;

  return (
    <div className={cn('flex w-full gap-3', isUser ? 'justify-end text-right' : 'justify-start text-left')}>
      {!isUser && (
        <div className="mt-1 rounded-full bg-primary/10 p-2 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      )}
      <div className={cn('max-w-[80%] rounded-3xl px-4 py-3 text-sm leading-relaxed shadow-sm', isUser ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted/80 text-foreground rounded-bl-sm')}>
        <p className="whitespace-pre-wrap">{message.text ?? ''}</p>
        <span className="mt-2 block text-[10px] uppercase tracking-wider text-muted-foreground/70">
          {formatTime(message.createdAt)}
        </span>
      </div>
      {isUser && (
        <div className="mt-1 rounded-full bg-primary p-2 text-primary-foreground shadow-md">
          <Icon className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};

const formatKey = (key: string) => {
  if (key === 'whatsappNumber') return 'WhatsApp';
  if (key === 'momoNumber') return 'MoMo';
  return key.replace(/([A-Z])/g, ' $1').trim();
};

const formatTime = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    return '';
  }
};

const SessionStatusBadge = ({ status }: { status: OnboardingSessionDto['status'] }) => {
  const copy = STATUS_COPY[status];
  const tone = copy?.tone ?? 'pending';
  const color = tone === 'done' ? 'bg-emerald-100 text-emerald-700' : tone === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary';

  return <Badge className={cn('rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide', color)}>{copy?.label ?? 'Onboarding'}</Badge>;
};

const useInitialLocale = () => {
  const [locale, setLocale] = useState<string>(() => (typeof navigator !== 'undefined' ? navigator.language?.slice(0, 2) ?? 'rw' : 'rw'));

  useEffect(() => {
    if (typeof navigator === 'undefined') {
      return;
    }
    setLocale(navigator.language?.slice(0, 2) ?? 'rw');
  }, []);

  return locale;
};

const useStoredSessionId = () => {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const stored = window.localStorage.getItem(SESSION_ID_KEY);
    if (stored) {
      setSessionId(stored);
    }
  }, []);

  const persist = (value: string | null) => {
    if (typeof window === 'undefined') {
      return;
    }
    if (value) {
      window.localStorage.setItem(SESSION_ID_KEY, value);
    } else {
      window.localStorage.removeItem(SESSION_ID_KEY);
    }
    setSessionId(value);
  };

  return [sessionId, persist] as const;
};

const OnboardingView = () => {
  const queryClient = useQueryClient();
  const locale = useInitialLocale();
  const [sessionId, setSessionId] = useStoredSessionId();
  const [input, setInput] = useState('');
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  const { login, user } = useAuth();
  const { toast } = useToast();

  const sessionQuery = useQuery({
    queryKey: ['onboarding', sessionId],
    enabled: Boolean(sessionId),
    queryFn: () => fetchOnboardingSession(sessionId as string),
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const createSessionMutation = useMutation({
    mutationFn: () => startOnboardingSession(locale ? { locale } : undefined),
    onSuccess: (data) => {
      setSessionId(data.id);
      queryClient.setQueryData(['onboarding', data.id], data);
      setHasBootstrapped(true);
    },
    onError: () => {
      setHasBootstrapped(true);
    },
  });

  useEffect(() => {
    if (!sessionId && !createSessionMutation.isPending && !hasBootstrapped) {
      createSessionMutation.mutate();
    }
  }, [createSessionMutation, sessionId, hasBootstrapped]);

  const sendMutation = useMutation({
    mutationFn: (message: string) => sendOnboardingMessage(sessionId as string, { message }),
    onSuccess: (data) => {
      queryClient.setQueryData(['onboarding', data.id], data);
      setInput('');
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: (onboardingSessionId: string) => login(onboardingSessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fan', 'session'] });
      router.replace('/');
      router.refresh();
    },
    onError: (error: unknown) => {
      toast({
        title: 'Unable to finalize onboarding',
        description: error instanceof Error ? error.message : 'Please try again shortly.',
        variant: 'destructive',
      });
    },
  });

  const session = sessionQuery.data ?? createSessionMutation.data;

  useEffect(() => {
    if (!sessionQuery.error) {
      return;
    }
    const status = (sessionQuery.error as { status?: number })?.status;
    if (status === 404) {
      setSessionId(null);
      queryClient.removeQueries({ queryKey: ['onboarding', sessionId] });
      setHasBootstrapped(false);
    }
  }, [sessionQuery.error, queryClient, sessionId]);

  useEffect(() => {
    if (!sessionId || !session) {
      return;
    }
    if (session.status === 'completed' && !finalizeMutation.isPending && !finalizeMutation.isSuccess) {
      finalizeMutation.mutate(sessionId);
    }
  }, [finalizeMutation, session, sessionId]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session?.messages.length, sendMutation.isPending]);

  const isLoadingSession = createSessionMutation.isPending || sessionQuery.isLoading;
  const needsWhatsappLogin = !user?.whatsappNumber;
  const isErrored = createSessionMutation.isError && !session;

  const messages = useMemo(() => session?.messages?.filter((message) => message.kind !== 'tool_call') ?? [], [session]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || !sessionId || sendMutation.isPending) {
      return;
    }
    sendMutation.mutate(text);
  };

  const handleReset = () => {
    setSessionId(null);
    setInput('');
    queryClient.removeQueries({ queryKey: ['onboarding'] });
    setHasBootstrapped(false);
    finalizeMutation.reset();
    createSessionMutation.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-3 py-6 text-foreground">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5">
        <header className="flex flex-col gap-3 text-center text-slate-100">
          <div className="flex items-center justify-center gap-2 text-sm font-semibold text-primary/80">
            <Bot className="h-5 w-5" />
            Rayon Sports Onboarding
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Mwaramutse! Let&apos;s set up your Rayon fan profile.
          </h1>
          <p className="text-sm text-slate-300">
            Share the WhatsApp number where we can reach you and the MoMo number you use to support the club. Our AI guide will handle the rest.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <SessionStatusBadge status={session?.status ?? 'collecting_profile'} />
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-foreground" onClick={handleReset} disabled={createSessionMutation.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Start new chat
            </Button>
            {session?.status === 'completed' && session?.id ? (
              <Button
                size="sm"
                variant="default"
                disabled={finalizeMutation.isPending}
                onClick={() => finalizeMutation.mutate(session.id)}
              >
                {finalizeMutation.isPending ? 'Preparing access…' : 'Enter the app'}
              </Button>
            ) : null}
          </div>
        </header>

        {needsWhatsappLogin ? <WhatsAppLoginNotice source="onboarding" /> : null}

        <Card className="flex min-h-[60vh] flex-1 flex-col overflow-hidden border-primary/20 bg-slate-950/80 shadow-2xl">
          <div className="flex h-full flex-col">
            <ScrollArea className="flex-1 px-4">
              <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 py-6">
                {isLoadingSession && (
                  <div className="flex flex-col gap-3">
                    <Skeleton className="h-16 w-full rounded-3xl bg-slate-800" />
                    <Skeleton className="h-16 w-3/4 self-end rounded-3xl bg-slate-800/80" />
                  </div>
                )}

                {isErrored && (
                  <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive-foreground">
                    We couldn&apos;t start the onboarding chat. Please refresh the page or try again.
                  </div>
                )}

                {!isLoadingSession && !isErrored && messages.length === 0 && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm text-primary">
                    GIKUNDIRO is getting ready. Say hello and share your contact details when you&apos;re ready!
                  </div>
                )}

                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}

                {sendMutation.isPending && (
                  <div className="flex max-w-[70%] items-center gap-2 rounded-3xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
                    <Bot className="h-4 w-4 animate-bounce" />
                    <span>GIKUNDIRO is typing…</span>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            <form onSubmit={handleSubmit} className="border-t border-primary/20 bg-slate-950/90 p-4">
              <Textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Type your message…"
                rows={3}
                disabled={!sessionId || sendMutation.isPending}
                className="resize-none border-primary/20 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
              />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Anonymous session – powered by OpenAI Agents</span>
                <Button type="submit" size="sm" disabled={!sessionId || sendMutation.isPending || input.trim().length === 0}>
                  Send
                  <Send className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OnboardingView;

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { BrowserMultiFormatReader } from "@zxing/browser";
import type { Result } from "@zxing/library";
import { ScanLine, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { fetchGateHistory, verifyTicketPass } from "@/lib/api/tickets";
import { emitNfcTap } from "@/lib/nfc";
import { recordAppStateEvent } from "@/lib/observability";
import { useToast } from "@/components/ui/use-toast";
import { useRealtime } from "@/providers/realtime-provider";

const LOCAL_HISTORY_KEY = "gate-local-history";
const LOCAL_HISTORY_LIMIT = 50;

type LocalHistoryItem = {
  id: string;
  token: string;
  status: string;
  stewardId?: string;
  zone?: string | null;
  timestamp: string;
};

function loadLocalHistory(): LocalHistoryItem[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = window.localStorage.getItem(LOCAL_HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as LocalHistoryItem[];
  } catch (error) {
    console.warn("Failed to load local gate history", error);
    return [];
  }
}

function saveLocalHistory(history: LocalHistoryItem[]) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history.slice(0, LOCAL_HISTORY_LIMIT)));
  } catch (error) {
    console.warn("Failed to persist local gate history", error);
  }
}

export default function Gate() {
  const { toast } = useToast();
  const { socket } = useRealtime();
  const [token, setToken] = useState("");
  const [stewardId, setStewardId] = useState("");
  const [dryRun, setDryRun] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [localHistory, setLocalHistory] = useState<LocalHistoryItem[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    setLocalHistory(loadLocalHistory());
  }, []);

  const mutation = useMutation({
    mutationFn: async (inputToken: string) => {
      if (!inputToken.trim()) {
        throw new Error("Enter a pass token");
      }
      return verifyTicketPass(inputToken.trim(), {
        dryRun,
        stewardId: stewardId.trim() || undefined,
      });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Verification failed";
      toast({ title: "Could not verify", description: message, variant: "destructive" });
    },
  });
  const { mutate: mutateVerification, data: result, isPending } = mutation;

  const historyQuery = useQuery({
    queryKey: ["gate", "history"],
    queryFn: fetchGateHistory,
    retry: 1,
  });
  const refetchHistory = historyQuery.refetch;

  const combinedHistory = useMemo(() => {
    const remote = historyQuery.data ?? [];
    const mappedRemote = remote.map((scan) => ({
      id: scan.id,
      token: scan.passId,
      status: scan.result,
      stewardId: scan.stewardId ?? undefined,
      zone: scan.pass.zone,
      timestamp: scan.createdAt,
    } satisfies LocalHistoryItem));

    return [...mappedRemote, ...localHistory].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [historyQuery.data, localHistory]);

  const appendLocalHistory = useCallback((status: string, zone?: string | null) => {
    const entry: LocalHistoryItem = {
      id: crypto.randomUUID(),
      token,
      status,
      zone: zone ?? null,
      stewardId: stewardId.trim() || undefined,
      timestamp: new Date().toISOString(),
    };
    setLocalHistory((prev) => {
      const next = [entry, ...prev].slice(0, LOCAL_HISTORY_LIMIT);
      saveLocalHistory(next);
      return next;
    });
  }, [stewardId, token]);

  const handleVerification = useCallback((inputToken: string) => {
    const trimmedToken = inputToken.trim();
    emitNfcTap({
      token: trimmedToken,
      method: cameraActive ? "camera" : "manual",
      stewardId: stewardId.trim() || null,
      dryRun,
    });

    void recordAppStateEvent({
      type: "nfc-tap-attempt",
      method: cameraActive ? "camera" : "manual",
      stewardId: stewardId.trim() || null,
      dryRun,
      tokenPreview: trimmedToken.slice(0, 12) || null,
    });

    mutateVerification(trimmedToken, {
      onSuccess: (res) => {
        if (dryRun) {
          appendLocalHistory(`${res.status}-preview`, res.zone);
        } else {
          appendLocalHistory(res.status, res.zone);
          refetchHistory();
        }
      },
    });
  }, [appendLocalHistory, cameraActive, dryRun, mutateVerification, refetchHistory, stewardId]);

  const handleScanResult = useCallback((result: Result) => {
    const text = result.getText();
    setToken(text);
    handleVerification(text);
  }, [handleVerification]);

  useEffect(() => {
    if (!cameraActive) {
      const reader = scannerRef.current as (BrowserMultiFormatReader & { reset?: () => void }) | null;
      reader?.reset?.();
      scannerRef.current = null;
      if (videoRef.current) {
        const stream = videoRef.current.srcObject as MediaStream | null;
        stream?.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      return;
    }

    const reader = new BrowserMultiFormatReader();
    scannerRef.current = reader;
    let cancelled = false;

    BrowserMultiFormatReader.listVideoInputDevices()
      .then((devices) => {
        if (cancelled) return;
        const deviceId = devices[0]?.deviceId;
        if (!deviceId) {
          throw new Error("No camera available");
        }
        return reader.decodeFromVideoDevice(deviceId, videoRef.current!, (scanResult) => {
          if (scanResult) {
            handleScanResult(scanResult);
          }
        });
      })
      .catch((error) => {
        console.error(error);
        toast({ title: "Camera unavailable", description: String(error), variant: "destructive" });
        setCameraActive(false);
      });

    return () => {
      cancelled = true;
      (reader as BrowserMultiFormatReader & { reset?: () => void }).reset?.();
      const stream = videoRef.current?.srcObject as MediaStream | null;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraActive, handleScanResult, toast]);

  useEffect(() => {
    if (!socket) return;

    const handleRemoteScan = (payload: { passId: string; result: string; stewardId?: string | null; gate?: string | null }) => {
      setLocalHistory((prev) => {
        const entry: LocalHistoryItem = {
          id: crypto.randomUUID(),
          token: payload.passId,
          status: payload.result,
          stewardId: payload.stewardId ?? undefined,
          zone: payload.gate ?? null,
          timestamp: new Date().toISOString(),
        };
        const next = [entry, ...prev].slice(0, LOCAL_HISTORY_LIMIT);
        saveLocalHistory(next);
        return next;
      });
      refetchHistory();
    };

    socket.on('tickets.gate.scan', handleRemoteScan);
    return () => {
      socket.off('tickets.gate.scan', handleRemoteScan);
    };
  }, [socket, refetchHistory]);

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8 pb-6 space-y-2">
        <h1 className="text-3xl font-black gradient-text">Gate Check</h1>
        <p className="text-muted-foreground">Scan or paste pass tokens to validate entry.</p>
      </div>

      <GlassCard className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <ScanLine className="w-6 h-6 text-primary" />
          <div>
            <p className="font-semibold text-foreground">Manual Token Entry</p>
            <p className="text-xs text-muted-foreground">Paste the token from the ticket or scan using the camera.</p>
          </div>
        </div>

        <Input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="e.g. 3fa85f64-..."
          className="font-mono"
        />
        <Input
          value={stewardId}
          onChange={(event) => setStewardId(event.target.value)}
          placeholder="Steward ID (optional)"
          className="font-mono"
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
              <Label htmlFor="dry-run" className="text-sm text-muted-foreground">
                Dry run (do not mark as used)
              </Label>
            </div>
            <Button
              type="button"
              variant={cameraActive ? "hero" : "glass"}
              size="sm"
              onClick={() => setCameraActive((prev) => !prev)}
            >
              <Camera className="w-4 h-4" /> {cameraActive ? "Stop Camera" : "Scan QR"}
            </Button>
          </div>
          <Button
            variant="hero"
            onClick={() => handleVerification(token)}
            disabled={isPending}
          >
            {mutation.isPending ? "Checking..." : "Verify"}
          </Button>
        </div>

        {cameraActive && (
          <div className="rounded-xl overflow-hidden bg-black">
            <video ref={videoRef} className="w-full aspect-video" autoPlay muted playsInline />
          </div>
        )}
      </GlassCard>

      {result && (
        <GlassCard className="mt-6 p-6 space-y-3">
          {result.status === "verified" && (
            <div className="flex items-center gap-3 text-success">
              <CheckCircle2 className="w-6 h-6" />
              <div>
                <p className="font-semibold text-success">Pass accepted</p>
                <p className="text-xs text-muted-foreground">Zone {result.zone ?? "-"} • Order {result.orderId}</p>
              </div>
            </div>
          )}

          {result.status === "used" && (
            <div className="flex items-center gap-3 text-accent">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <p className="font-semibold text-accent">Already used</p>
                <p className="text-xs text-muted-foreground">Pass {result.passId}</p>
              </div>
            </div>
          )}

          {result.status === "refunded" && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <RefreshCw className="w-6 h-6" />
              <div>
                <p className="font-semibold text-foreground">Refunded ticket</p>
                <p className="text-xs text-muted-foreground">Pass {result.passId}</p>
              </div>
            </div>
          )}

          {result.status === "not_found" && (
            <div className="flex items-center gap-3 text-destructive">
              <XCircle className="w-6 h-6" />
              <div>
                <p className="font-semibold text-destructive">No pass found</p>
                <p className="text-xs text-muted-foreground">Check the token and try again.</p>
              </div>
            </div>
          )}
        </GlassCard>
      )}

      <GlassCard className="mt-6 p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Recent Scans</h3>
          <Button variant="glass" size="sm" onClick={() => refetchHistory()} disabled={historyQuery.isFetching}>
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
        {historyQuery.isLoading && <p className="text-sm text-muted-foreground">Loading scan history…</p>}
        {!historyQuery.isLoading && combinedHistory.length === 0 && (
          <p className="text-sm text-muted-foreground">No scans recorded yet.</p>
        )}
        {combinedHistory.length > 0 && (
          <div className="space-y-2">
            {combinedHistory.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-xl bg-muted/10 border border-muted/30 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div>
                  <p className="font-semibold text-foreground">{entry.status.toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    Pass {entry.token.slice(0, 8)}… · Steward {entry.stewardId?.slice(0, 8) ?? '—'}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground text-right sm:text-left">
                  {new Date(entry.timestamp).toLocaleTimeString()} {entry.zone ? `· Zone ${entry.zone}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

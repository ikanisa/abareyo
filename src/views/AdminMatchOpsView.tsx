"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Activity, Calendar, MapPin, PlusCircle, RefreshCw, Trash2 } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAdminSession } from "@/providers/admin-session-provider";
import { useAdminLocale } from "@/providers/admin-locale-provider";
import { useRealtime } from "@/providers/realtime-provider";
import {
  AdminMatch,
  MatchScanMetric,
  createAdminMatch,
  deleteAdminMatch,
  deleteMatchGate,
  deleteMatchZone,
  fetchAdminMatches,
  fetchMatchScanMetrics,
  upsertMatchGate,
  upsertMatchZone,
  updateAdminMatch,
} from "@/lib/api/admin/match";

const MATCH_STATUS_OPTIONS: Array<AdminMatch["status"]> = ["scheduled", "live", "finished", "postponed"];

type AdminTranslate = (key: string, fallback?: string) => string;

const formatInputDate = (iso?: string | null) => {
  if (!iso) {
    return "";
  }
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
};

export type AdminMatchOpsViewProps = {
  initialMatches: AdminMatch[];
};

const AdminMatchOpsView = ({ initialMatches }: AdminMatchOpsViewProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { permissions } = useAdminSession();
  const { socket } = useRealtime();
  const { t } = useAdminLocale();

  const canCreateMatch = permissions.includes("match:create");
  const canUpdateMatch = permissions.includes("match:update");
  const canDeleteMatch = permissions.includes("match:delete");
  const canManageGates = permissions.includes("gate:update");

  const matchStatusLabels = useMemo(
    () => ({
      scheduled: t('admin.matchOps.status.scheduled', 'Scheduled'),
      live: t('admin.matchOps.status.live', 'Live'),
      finished: t('admin.matchOps.status.finished', 'Finished'),
      postponed: t('admin.matchOps.status.postponed', 'Postponed'),
    }),
    [t],
  );

  const formatDateLabel = useCallback(
    (iso?: string | null) => {
      if (!iso) {
        return t('admin.matchOps.match.unscheduled', 'TBD');
      }
      const date = new Date(iso);
      return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    },
    [t],
  );

  const matchesQuery = useQuery({
    queryKey: ["admin", "match-ops", "matches"],
    queryFn: fetchAdminMatches,
    initialData: initialMatches,
  });

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(() => initialMatches[0]?.id ?? null);

  useEffect(() => {
    if (!selectedMatchId && matchesQuery.data && matchesQuery.data.length) {
      setSelectedMatchId(matchesQuery.data[0].id);
    }
  }, [matchesQuery.data, selectedMatchId]);

  const selectedMatch = useMemo(() => {
    return matchesQuery.data?.find((match) => match.id === selectedMatchId) ?? null;
  }, [matchesQuery.data, selectedMatchId]);

  const metricsQuery = useQuery({
    queryKey: ["admin", "match-ops", "metrics", selectedMatch?.id],
    queryFn: () => fetchMatchScanMetrics(selectedMatch!.id),
    enabled: Boolean(selectedMatch?.id) && canManageGates,
  });
  const [metricsSnapshot, setMetricsSnapshot] = useState<MatchScanMetric[]>([]);

  const createMutation = useMutation({
    mutationFn: createAdminMatch,
    onSuccess: (match) => {
      toast({
        title: t('admin.matchOps.toast.createSuccess.title', 'Match created'),
        description: t(
          'admin.matchOps.toast.createSuccess.description',
          `vs ${match.opponent} on ${formatDateLabel(match.kickoff)}`,
        ),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
      setSelectedMatchId(match.id);
    },
    onError: (error: unknown) => {
      toast({
        title: t('admin.matchOps.toast.createError.title', 'Unable to create match'),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ matchId, payload }: { matchId: string; payload: Parameters<typeof updateAdminMatch>[1] }) =>
      updateAdminMatch(matchId, payload),
    onSuccess: (match) => {
      toast({
        title: t('admin.matchOps.toast.updateSuccess.title', 'Match updated'),
        description: t(
          'admin.matchOps.toast.updateSuccess.description',
          `Status → ${matchStatusLabels[match.status]}`,
        ),
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
    },
    onError: (error: unknown) => {
      toast({
        title: t('admin.matchOps.toast.updateError.title', 'Update failed'),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminMatch,
    onSuccess: () => {
      toast({ title: t('admin.matchOps.toast.deleteSuccess.title', 'Match removed') });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
      setSelectedMatchId(null);
    },
    onError: (error: unknown) => {
      toast({
        title: t('admin.matchOps.toast.deleteError.title', 'Delete failed'),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const zoneMutation = useMutation({
    mutationFn: ({ matchId, payload }: { matchId: string; payload: Parameters<typeof upsertMatchZone>[1] }) =>
      upsertMatchZone(matchId, payload),
    onSuccess: () => {
      toast({ title: t('admin.matchOps.toast.zoneSuccess.title', 'Zone saved') });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
    },
    onError: (error: unknown) => {
      toast({
        title: t('admin.matchOps.toast.zoneError.title', 'Unable to save zone'),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: ({ matchId, zoneId }: { matchId: string; zoneId: string }) => deleteMatchZone(matchId, zoneId),
    onSuccess: () => {
      toast({ title: t('admin.matchOps.toast.zoneDeleteSuccess.title', 'Zone deleted') });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
    },
    onError: (error: unknown) => {
      toast({
        title: t('admin.matchOps.toast.deleteError.title', 'Delete failed'),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const gateMutation = useMutation({
    mutationFn: ({ matchId, payload }: { matchId: string; payload: Parameters<typeof upsertMatchGate>[1] }) =>
      upsertMatchGate(matchId, payload),
    onSuccess: () => {
      toast({ title: t('admin.matchOps.toast.gateSuccess.title', 'Gate saved') });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "metrics", selectedMatchId] });
    },
    onError: (error: unknown) => {
      toast({
        title: t('admin.matchOps.toast.gateError.title', 'Unable to save gate'),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const deleteGateMutation = useMutation({
    mutationFn: ({ matchId, gateId }: { matchId: string; gateId: string }) => deleteMatchGate(matchId, gateId),
    onSuccess: () => {
      toast({ title: t('admin.matchOps.toast.gateDeleteSuccess.title', 'Gate deleted') });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "metrics", selectedMatchId] });
    },
    onError: (error: unknown) => {
      toast({
        title: t('admin.matchOps.toast.deleteError.title', 'Delete failed'),
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!selectedMatchId) {
      setMetricsSnapshot([]);
      return;
    }

    if (metricsQuery.data) {
      setMetricsSnapshot(metricsQuery.data);
    } else if (!metricsQuery.isFetching) {
      setMetricsSnapshot([]);
    }
  }, [metricsQuery.data, metricsQuery.isFetching, selectedMatchId]);

  useEffect(() => {
    if (!socket || !selectedMatchId) {
      return;
    }

    const handler = (payload: unknown) => {
      if (!payload || typeof payload !== "object") {
        return;
      }
      const data = payload as Record<string, unknown>;
      if (typeof data.matchId !== "string" || data.matchId !== selectedMatchId) {
        return;
      }
      const metrics = Array.isArray(data.metrics) ? data.metrics : null;
      if (!metrics) {
        return;
      }
      const mapped: MatchScanMetric[] = metrics
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const value = item as Record<string, unknown>;
          return {
            gate: typeof value.gate === "string" ? value.gate : "Unassigned",
            total: Number(value.total ?? 0),
            verified: Number(value.verified ?? 0),
            rejected: Number(value.rejected ?? 0),
          };
        })
        .filter((metric): metric is MatchScanMetric => metric !== null);
      setMetricsSnapshot(mapped);
    };

    socket.on("tickets.gate.metrics", handler);
    return () => {
      socket.off("tickets.gate.metrics", handler);
    };
  }, [socket, selectedMatchId]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">
            {t('admin.matchOps.header.title', 'Match operations')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('admin.matchOps.header.subtitle', 'Manage fixtures, zones, and throughput targets with confidence.')}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => matchesQuery.refetch()}
          disabled={matchesQuery.isFetching}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {t('admin.matchOps.actions.refresh', 'Refresh')}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <GlassCard className="flex h-[32rem] flex-col overflow-hidden">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {t('admin.matchOps.matches.title', 'Matches')}
              </h2>
              <Badge variant="outline" className="bg-white/10 text-xs text-slate-200">
                {matchesQuery.data?.length ?? 0}
              </Badge>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-2 p-4">
              {(matchesQuery.data ?? []).map((match) => {
                const isActive = match.id === selectedMatchId;
                return (
                  <button
                    key={match.id}
                    onClick={() => setSelectedMatchId(match.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition hover:border-primary/50 hover:bg-white/[0.04] ${
                      isActive ? "border-primary bg-primary/10" : "border-white/10 bg-white/[0.02]"
                    }`}
                  >
                    <div className="text-xs uppercase tracking-wide text-slate-400">
                      {match.competition ?? t('admin.matchOps.matches.friendly', 'Friendly')}
                    </div>
                    <div className="text-sm font-semibold text-slate-100">
                      {t('admin.matchOps.matches.vsOpponent', `vs ${match.opponent}`)}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateLabel(match.kickoff)}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {match.venue || t('admin.matchOps.matches.venuePending', 'Venue pending')}
                    </div>
                    <div className="mt-2 text-xs text-primary">
                      {t('admin.matchOps.matches.statusLabel', 'Status:')} {matchStatusLabels[match.status]}
                    </div>
                  </button>
                );
              })}
              {(matchesQuery.data?.length ?? 0) === 0 && (
                <p className="text-sm text-slate-400">
                  {t('admin.matchOps.matches.empty', 'No matches defined yet. Create one to get started.')}
                </p>
              )}
            </div>
          </ScrollArea>
          {canCreateMatch && (
            <div className="border-t border-white/10 p-4">
              <CreateMatchForm
                isSubmitting={createMutation.isPending}
                onSubmit={(payload) => createMutation.mutate(payload)}
                translate={t}
                statusLabels={matchStatusLabels}
              />
            </div>
          )}
        </GlassCard>

        <div className="space-y-6">
          {selectedMatch ? (
            <MatchDetailPanel
              match={selectedMatch}
              canUpdate={canUpdateMatch}
              canDelete={canDeleteMatch}
              canManageGates={canManageGates}
              metrics={metricsSnapshot}
              metricsLoading={metricsQuery.isLoading}
              onUpdate={(payload) => updateMutation.mutate({ matchId: selectedMatch.id, payload })}
              onDelete={() => deleteMutation.mutate(selectedMatch.id)}
              onSaveZone={(payload) => zoneMutation.mutate({ matchId: selectedMatch.id, payload })}
              onDeleteZone={(zoneId) => deleteZoneMutation.mutate({ matchId: selectedMatch.id, zoneId })}
              onSaveGate={(payload) => gateMutation.mutate({ matchId: selectedMatch.id, payload })}
              onDeleteGate={(gateId) => deleteGateMutation.mutate({ matchId: selectedMatch.id, gateId })}
              isMutating={
                updateMutation.isPending ||
                deleteMutation.isPending ||
                zoneMutation.isPending ||
                deleteZoneMutation.isPending ||
                gateMutation.isPending ||
                deleteGateMutation.isPending
              }
              translate={t}
              statusLabels={matchStatusLabels}
              formatDate={formatDateLabel}
            />
          ) : (
            <GlassCard className="flex h-[32rem] items-center justify-center">
              <p className="text-sm text-slate-400">
                {t('admin.matchOps.matches.selectPrompt', 'Select a match to view operational controls.')}
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMatchOpsView;

const CreateMatchForm = ({
  isSubmitting,
  onSubmit,
  translate,
  statusLabels,
}: {
  isSubmitting: boolean;
  onSubmit: (payload: Parameters<typeof createAdminMatch>[0]) => void;
  translate: AdminTranslate;
  statusLabels: Record<AdminMatch['status'], string>;
}) => {
  const t = translate;
  const [opponent, setOpponent] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [venue, setVenue] = useState("");
  const [status, setStatus] = useState<AdminMatch["status"]>("scheduled");
  const [competition, setCompetition] = useState("");

  return (
    <form
      className="space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!opponent || !kickoff || !venue) {
          return;
        }
        onSubmit({
          opponent,
          venue,
          kickoff: new Date(kickoff).toISOString(),
          status,
          competition: competition || undefined,
        });
        setOpponent("");
        setKickoff("");
        setVenue("");
        setCompetition("");
        setStatus("scheduled");
      }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">
          {t('admin.matchOps.form.newMatch', 'New match')}
        </h3>
        <Badge variant="outline" className="bg-white/5 text-xs text-slate-300">
          <PlusCircle className="mr-1 h-3 w-3" />
          {t('admin.matchOps.form.createBadge', 'Create')}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="match-opponent" className="text-xs text-slate-300">
            {t('admin.matchOps.form.opponentLabel', 'Opponent')}
          </Label>
          <Input
            id="match-opponent"
            value={opponent}
            onChange={(event) => setOpponent(event.target.value)}
            placeholder={t('admin.matchOps.form.opponentPlaceholder', 'APR FC')}
            className="bg-white/5 text-slate-100"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="match-kickoff" className="text-xs text-slate-300">
            {t('admin.matchOps.form.kickoffLabel', 'Kickoff')}
          </Label>
          <Input
            id="match-kickoff"
            type="datetime-local"
            value={kickoff}
            onChange={(event) => setKickoff(event.target.value)}
            className="bg-white/5 text-slate-100"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="match-venue" className="text-xs text-slate-300">
            {t('admin.matchOps.form.venueLabel', 'Venue')}
          </Label>
          <Input
            id="match-venue"
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            placeholder={t('admin.matchOps.form.venuePlaceholder', 'Kigali Stadium')}
            className="bg-white/5 text-slate-100"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="match-status" className="text-xs text-slate-300">
            {t('admin.matchOps.form.statusLabel', 'Status')}
          </Label>
          <Select value={status} onValueChange={(value) => setStatus(value as AdminMatch["status"])}>
            <SelectTrigger className="bg-white/5 text-slate-100">
              <SelectValue placeholder={t('admin.matchOps.form.statusPlaceholder', 'Select status')} />
            </SelectTrigger>
            <SelectContent>
              {MATCH_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {statusLabels[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="match-competition" className="text-xs text-slate-300">
            {t('admin.matchOps.form.competitionLabel', 'Competition (optional)')}
          </Label>
          <Input
            id="match-competition"
            value={competition}
            onChange={(event) => setCompetition(event.target.value)}
            placeholder={t('admin.matchOps.form.competitionPlaceholder', 'Rwanda Premier League')}
            className="bg-white/5 text-slate-100"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? t('admin.matchOps.form.creating', 'Creating…')
          : t('admin.matchOps.form.submit', 'Create match')}
      </Button>
    </form>
  );
};

const MatchDetailPanel = ({
  match,
  canUpdate,
  canDelete,
  canManageGates,
  metrics,
  metricsLoading,
  onUpdate,
  onDelete,
  onSaveZone,
  onDeleteZone,
  onSaveGate,
  onDeleteGate,
  isMutating,
  translate,
  statusLabels,
  formatDate,
}: {
  match: AdminMatch;
  canUpdate: boolean;
  canDelete: boolean;
  canManageGates: boolean;
  metrics: MatchScanMetric[];
  metricsLoading: boolean;
  onUpdate: (payload: Parameters<typeof updateAdminMatch>[1]) => void;
  onDelete: () => void;
  onSaveZone: (payload: Parameters<typeof upsertMatchZone>[1]) => void;
  onDeleteZone: (zoneId: string) => void;
  onSaveGate: (payload: Parameters<typeof upsertMatchGate>[1]) => void;
  onDeleteGate: (gateId: string) => void;
  isMutating: boolean;
  translate: AdminTranslate;
  statusLabels: Record<AdminMatch['status'], string>;
  formatDate: (iso?: string | null) => string;
}) => {
  const t = translate;
  const [formOpponent, setFormOpponent] = useState(match.opponent);
  const [formKickoff, setFormKickoff] = useState(formatInputDate(match.kickoff));
  const [formVenue, setFormVenue] = useState(match.venue);
  const [formCompetition, setFormCompetition] = useState(match.competition ?? "");
  const [formStatus, setFormStatus] = useState<AdminMatch["status"]>(match.status);

  const [zoneName, setZoneName] = useState("");
  const [zoneCapacity, setZoneCapacity] = useState("");
  const [zonePrice, setZonePrice] = useState("");
  const [zoneGate, setZoneGate] = useState("");

  const [gateName, setGateName] = useState("");
  const [gateLocation, setGateLocation] = useState("");
  const [gateThroughput, setGateThroughput] = useState("");

  useEffect(() => {
    setFormOpponent(match.opponent);
    setFormKickoff(formatInputDate(match.kickoff));
    setFormVenue(match.venue);
    setFormCompetition(match.competition ?? "");
    setFormStatus(match.status);
  }, [match]);

  const opponentHeading = t('admin.matchOps.detail.vsOpponent', `vs ${match.opponent}`);
  const venueDisplay = match.venue || t('admin.matchOps.detail.venuePending', 'Venue pending');
  const competitionLabel = match.competition ?? t('admin.matchOps.matches.friendly', 'Friendly');

  return (
    <div className="space-y-6">
      <GlassCard className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">{opponentHeading}</h2>
            <p className="text-sm text-slate-400">
              {t('admin.matchOps.detail.schedule', `${formatDate(match.kickoff)} · ${venueDisplay}`)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-white/10 text-xs text-slate-200">
              {competitionLabel}
            </Badge>
            <Badge variant="secondary" className="bg-primary/15 text-xs text-primary">
              {statusLabels[match.status]}
            </Badge>
          </div>
        </div>

        {canUpdate ? (
          <form
            className="grid gap-4 md:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              onUpdate({
                opponent: formOpponent,
                venue: formVenue,
                kickoff: formKickoff ? new Date(formKickoff).toISOString() : undefined,
                status: formStatus,
                competition: formCompetition || undefined,
              });
            }}
          >
            <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300" htmlFor="match-detail-opponent">
                  {t('admin.matchOps.detail.opponentLabel', 'Opponent')}
                </Label>
                <Input
                  id="match-detail-opponent"
                  value={formOpponent}
                  onChange={(event) => setFormOpponent(event.target.value)}
                  className="bg-white/5 text-slate-100"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-300" htmlFor="match-detail-venue">
                  {t('admin.matchOps.detail.venueLabel', 'Venue')}
                </Label>
                <Input
                  id="match-detail-venue"
                  value={formVenue}
                  onChange={(event) => setFormVenue(event.target.value)}
                  className="bg-white/5 text-slate-100"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300" htmlFor="match-detail-kickoff">
                {t('admin.matchOps.detail.kickoffLabel', 'Kickoff')}
              </Label>
              <Input
                id="match-detail-kickoff"
                type="datetime-local"
                value={formKickoff}
                onChange={(event) => setFormKickoff(event.target.value)}
                className="bg-white/5 text-slate-100"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300" htmlFor="match-detail-status">
                {t('admin.matchOps.detail.statusLabel', 'Status')}
              </Label>
              <Select value={formStatus} onValueChange={(value) => setFormStatus(value as AdminMatch["status"])}>
                <SelectTrigger id="match-detail-status" className="bg-white/5 text-slate-100">
                  <SelectValue placeholder={t('admin.matchOps.detail.statusPlaceholder', 'Select status')} />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {statusLabels[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs text-slate-300" htmlFor="match-detail-competition">
                {t('admin.matchOps.detail.competitionLabel', 'Competition')}
              </Label>
              <Input
                id="match-detail-competition"
                value={formCompetition}
                onChange={(event) => setFormCompetition(event.target.value)}
                className="bg-white/5 text-slate-100"
                placeholder={t('admin.matchOps.detail.competitionPlaceholder', 'Rwanda Premier League')}
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button type="submit" disabled={isMutating}>
                {t('admin.matchOps.detail.save', 'Save changes')}
              </Button>
              {canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isMutating}
                  onClick={() => onDelete()}
                  className="bg-red-500/90 hover:bg-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('admin.matchOps.detail.remove', 'Remove match')}
                </Button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-400">
            {t(
              'admin.matchOps.detail.readonly',
              'You cannot update match details. Contact an administrator if this is unexpected.',
            )}
          </p>
        )}
      </GlassCard>

      <GlassCard className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                {t('admin.matchOps.zones.title', 'Ticket zones')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('admin.matchOps.zones.subtitle', 'Update inventory slices, pricing, and gate assignments.')}
              </p>
            </div>
            <Badge variant="outline" className="bg-white/10 text-xs text-slate-200">
              {match.zones.length}
            </Badge>
          </header>
          <div className="space-y-2">
            {match.zones.map((zone) => (
              <div key={zone.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{zone.name}</div>
                    <div className="text-xs text-slate-400">
                      {t(
                        'admin.matchOps.zones.summary',
                        `${zone.capacity.toLocaleString()} seats · ${zone.price.toLocaleString()} RWF`,
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t('admin.matchOps.zones.gateLabel', `Gate ${zone.gate ?? '–'}`)}
                    </div>
                  </div>
                  {canUpdate && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-300 hover:text-red-300"
                      onClick={() => onDeleteZone(zone.id)}
                      disabled={isMutating}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {match.zones.length === 0 && (
              <p className="text-xs text-slate-400">
                {t('admin.matchOps.zones.empty', 'No zones configured. Add your first zone below.')}
              </p>
            )}
          </div>
          {canUpdate && (
            <form
              className="grid gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!zoneName || !zoneCapacity || !zonePrice) {
                  return;
                }
                onSaveZone({
                  name: zoneName,
                  capacity: Number(zoneCapacity),
                  price: Number(zonePrice),
                  gate: zoneGate || undefined,
                });
                setZoneName("");
                setZoneCapacity("");
                setZonePrice("");
                setZoneGate("");
              }}
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                <PlusCircle className="h-3.5 w-3.5" />
                {t('admin.matchOps.zones.addOrUpdate', 'Add or update zone')}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={zoneName}
                  onChange={(event) => setZoneName(event.target.value)}
                  placeholder={t('admin.matchOps.zones.namePlaceholder', 'North Stand')}
                  className="bg-white/5 text-slate-100"
                  required
                />
                <Input
                  type="number"
                  min={0}
                  value={zoneCapacity}
                  onChange={(event) => setZoneCapacity(event.target.value)}
                  placeholder={t('admin.matchOps.zones.capacityPlaceholder', 'Capacity')}
                  className="bg-white/5 text-slate-100"
                  required
                />
                <Input
                  type="number"
                  min={0}
                  value={zonePrice}
                  onChange={(event) => setZonePrice(event.target.value)}
                  placeholder={t('admin.matchOps.zones.pricePlaceholder', 'Price')}
                  className="bg-white/5 text-slate-100"
                  required
                />
                <Input
                  value={zoneGate}
                  onChange={(event) => setZoneGate(event.target.value)}
                  placeholder={t('admin.matchOps.zones.gatePlaceholder', 'Gate (optional)')}
                  className="bg-white/5 text-slate-100"
                />
              </div>
              <Button type="submit" disabled={isMutating}>
                {t('admin.matchOps.zones.save', 'Save zone')}
              </Button>
            </form>
          )}
        </section>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">
                {t('admin.matchOps.gates.title', 'Gates & throughput')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('admin.matchOps.gates.subtitle', 'Coordinate stewarding targets ahead of matchday.')}
              </p>
            </div>
            <Badge variant="outline" className="bg-white/10 text-xs text-slate-200">
              {match.gates.length}
            </Badge>
          </header>
          <div className="space-y-2">
            {match.gates.map((gate) => (
              <div key={gate.id} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-100">{gate.name}</div>
                    <div className="text-xs text-slate-400">
                      {gate.location
                        ? gate.location
                        : t('admin.matchOps.gates.locationPending', 'No location set')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {t(
                        'admin.matchOps.gates.throughputLabel',
                        `Max throughput: ${gate.maxThroughput ?? '—'} / hr`,
                      )}
                    </div>
                  </div>
                  {canManageGates && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-slate-300 hover:text-red-300"
                      onClick={() => onDeleteGate(gate.id)}
                      disabled={isMutating}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {match.gates.length === 0 && (
              <p className="text-xs text-slate-400">
                {t('admin.matchOps.gates.empty', 'No gates configured. Add throughput targets below.')}
              </p>
            )}
          </div>
          {canManageGates && (
            <form
              className="grid gap-2 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4"
              onSubmit={(event) => {
                event.preventDefault();
                if (!gateName) {
                  return;
                }
                onSaveGate({
                  name: gateName,
                  location: gateLocation || undefined,
                  maxThroughput: gateThroughput ? Number(gateThroughput) : undefined,
                });
                setGateName("");
                setGateLocation("");
                setGateThroughput("");
              }}
            >
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                <PlusCircle className="h-3.5 w-3.5" />
                {t('admin.matchOps.gates.addOrUpdate', 'Add or update gate')}
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={gateName}
                  onChange={(event) => setGateName(event.target.value)}
                  placeholder={t('admin.matchOps.gates.namePlaceholder', 'Gate A')}
                  className="bg-white/5 text-slate-100"
                  required
                />
                <Input
                  value={gateLocation}
                  onChange={(event) => setGateLocation(event.target.value)}
                  placeholder={t('admin.matchOps.gates.locationPlaceholder', 'North concourse')}
                  className="bg-white/5 text-slate-100"
                />
                <Input
                  type="number"
                  min={0}
                  value={gateThroughput}
                  onChange={(event) => setGateThroughput(event.target.value)}
                  placeholder={t('admin.matchOps.gates.throughputPlaceholder', 'Max per hour')}
                  className="bg-white/5 text-slate-100"
                />
              </div>
              <Button type="submit" disabled={isMutating}>
                {t('admin.matchOps.gates.save', 'Save gate')}
              </Button>
            </form>
          )}

          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <Activity className="h-3.5 w-3.5" />
              {t('admin.matchOps.metrics.title', 'Live scan metrics')}
            </div>
            {canManageGates ? (
              metricsLoading ? (
                <p className="mt-2 text-xs text-slate-400">{t('admin.matchOps.metrics.loading', 'Loading metrics…')}</p>
              ) : metrics.length ? (
                <ul className="mt-2 space-y-2 text-xs text-slate-300">
                  {metrics.map((metric) => (
                    <li key={metric.gate} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                      <span className="font-medium text-slate-200">{metric.gate}</span>
                      <span className="text-slate-400">
                        {t(
                          'admin.matchOps.metrics.summary',
                          `${metric.total} scans · ${metric.verified} ok · ${metric.rejected} flagged`,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-400">
                  {t('admin.matchOps.metrics.empty', 'No scans recorded yet for this match.')}
                </p>
              )
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                {t(
                  'admin.matchOps.metrics.permission',
                  'You need gate:update permission to view throughput metrics.',
                )}
              </p>
            )}
          </div>
        </section>
      </GlassCard>
    </div>
  );
};

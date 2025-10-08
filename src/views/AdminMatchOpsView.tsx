"use client";

import { useEffect, useMemo, useState } from "react";
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

const MATCH_STATUS_LABELS: Record<AdminMatch["status"], string> = {
  scheduled: "Scheduled",
  live: "Live",
  finished: "Finished",
  postponed: "Postponed",
};

const formatDateLabel = (iso?: string | null) => {
  if (!iso) {
    return "TBD";
  }
  const date = new Date(iso);
  return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
};

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

  const canCreateMatch = permissions.includes("match:create");
  const canUpdateMatch = permissions.includes("match:update");
  const canDeleteMatch = permissions.includes("match:delete");
  const canManageGates = permissions.includes("gate:update");

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

  const createMutation = useMutation({
    mutationFn: createAdminMatch,
    onSuccess: (match) => {
      toast({
        title: "Match created",
        description: `vs ${match.opponent} on ${formatDateLabel(match.kickoff)}`,
      });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
      setSelectedMatchId(match.id);
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to create match",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ matchId, payload }: { matchId: string; payload: Parameters<typeof updateAdminMatch>[1] }) =>
      updateAdminMatch(matchId, payload),
    onSuccess: (match) => {
      toast({ title: "Match updated", description: `Status → ${MATCH_STATUS_LABELS[match.status]}` });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminMatch,
    onSuccess: () => {
      toast({ title: "Match removed" });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
      setSelectedMatchId(null);
    },
    onError: (error: unknown) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const zoneMutation = useMutation({
    mutationFn: ({ matchId, payload }: { matchId: string; payload: Parameters<typeof upsertMatchZone>[1] }) =>
      upsertMatchZone(matchId, payload),
    onSuccess: () => {
      toast({ title: "Zone saved" });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to save zone",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: ({ matchId, zoneId }: { matchId: string; zoneId: string }) => deleteMatchZone(matchId, zoneId),
    onSuccess: () => {
      toast({ title: "Zone deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const gateMutation = useMutation({
    mutationFn: ({ matchId, payload }: { matchId: string; payload: Parameters<typeof upsertMatchGate>[1] }) =>
      upsertMatchGate(matchId, payload),
    onSuccess: () => {
      toast({ title: "Gate saved" });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "metrics", selectedMatchId] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Unable to save gate",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  const deleteGateMutation = useMutation({
    mutationFn: ({ matchId, gateId }: { matchId: string; gateId: string }) => deleteMatchGate(matchId, gateId),
    onSuccess: () => {
      toast({ title: "Gate deleted" });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "matches"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "match-ops", "metrics", selectedMatchId] });
    },
    onError: (error: unknown) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Match Operations</h1>
          <p className="text-sm text-slate-400">Configure fixtures, ticketing zones, and gate throughput targets.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => matchesQuery.refetch()}
          disabled={matchesQuery.isFetching}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <GlassCard className="flex h-[32rem] flex-col overflow-hidden">
          <div className="border-b border-white/10 p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Matches</h2>
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
                    <div className="text-xs uppercase tracking-wide text-slate-400">{match.competition ?? "Friendly"}</div>
                    <div className="text-sm font-semibold text-slate-100">vs {match.opponent}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDateLabel(match.kickoff)}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {match.venue}
                    </div>
                    <div className="mt-2 text-xs text-primary">Status: {MATCH_STATUS_LABELS[match.status]}</div>
                  </button>
                );
              })}
              {(matchesQuery.data?.length ?? 0) === 0 && (
                <p className="text-sm text-slate-400">No matches defined yet. Create one to get started.</p>
              )}
            </div>
          </ScrollArea>
          {canCreateMatch && (
            <div className="border-t border-white/10 p-4">
              <CreateMatchForm
                isSubmitting={createMutation.isPending}
                onSubmit={(payload) => createMutation.mutate(payload)}
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
              metrics={metricsQuery.data ?? []}
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
            />
          ) : (
            <GlassCard className="flex h-[32rem] items-center justify-center">
              <p className="text-sm text-slate-400">Select a match to view operational controls.</p>
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
}: {
  isSubmitting: boolean;
  onSubmit: (payload: Parameters<typeof createAdminMatch>[0]) => void;
}) => {
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
        <h3 className="text-sm font-semibold text-slate-200">New Match</h3>
        <Badge variant="outline" className="bg-white/5 text-xs text-slate-300">
          <PlusCircle className="mr-1 h-3 w-3" />
          Create
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="space-y-1">
          <Label htmlFor="match-opponent" className="text-xs text-slate-300">
            Opponent
          </Label>
          <Input
            id="match-opponent"
            value={opponent}
            onChange={(event) => setOpponent(event.target.value)}
            placeholder="APR FC"
            className="bg-white/5 text-slate-100"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="match-kickoff" className="text-xs text-slate-300">
            Kickoff
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
            Venue
          </Label>
          <Input
            id="match-venue"
            value={venue}
            onChange={(event) => setVenue(event.target.value)}
            placeholder="Kigali Stadium"
            className="bg-white/5 text-slate-100"
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="match-status" className="text-xs text-slate-300">
            Status
          </Label>
          <Select value={status} onValueChange={(value) => setStatus(value as AdminMatch["status"])}>
            <SelectTrigger className="bg-white/5 text-slate-100">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {MATCH_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {MATCH_STATUS_LABELS[option]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="match-competition" className="text-xs text-slate-300">
            Competition (optional)
          </Label>
          <Input
            id="match-competition"
            value={competition}
            onChange={(event) => setCompetition(event.target.value)}
            placeholder="Rwanda Premier League"
            className="bg-white/5 text-slate-100"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create match"}
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
}) => {
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

  return (
    <div className="space-y-6">
      <GlassCard className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-slate-100">vs {match.opponent}</h2>
            <p className="text-sm text-slate-400">{formatDateLabel(match.kickoff)} · {match.venue}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-white/10 text-xs text-slate-200">
              {match.competition ?? "Friendly"}
            </Badge>
            <Badge variant="secondary" className="bg-primary/15 text-xs text-primary">
              {MATCH_STATUS_LABELS[match.status]}
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
                  Opponent
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
                  Venue
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
                Kickoff
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
              <Label className="text-xs text-slate-300">Status</Label>
              <Select value={formStatus} onValueChange={(value) => setFormStatus(value as AdminMatch["status"])}>
                <SelectTrigger className="bg-white/5 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MATCH_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {MATCH_STATUS_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs text-slate-300" htmlFor="match-detail-competition">
                Competition
              </Label>
              <Input
                id="match-detail-competition"
                value={formCompetition}
                onChange={(event) => setFormCompetition(event.target.value)}
                className="bg-white/5 text-slate-100"
                placeholder="Rwanda Premier League"
              />
            </div>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button type="submit" disabled={isMutating}>
                Save changes
              </Button>
              {canDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isMutating}
                  onClick={() => onDelete()}
                  className="bg-red-500/90 hover:bg-red-500"
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Remove match
                </Button>
              )}
            </div>
          </form>
        ) : (
          <p className="text-sm text-slate-400">
            You do not have permission to update match details. Contact an administrator if this is unexpected.
          </p>
        )}
      </GlassCard>

      <GlassCard className="grid gap-6 p-6 lg:grid-cols-2">
        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Ticket Zones</h3>
              <p className="text-xs text-slate-400">Update inventory slices, pricing, and gate assignments.</p>
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
                      {zone.capacity.toLocaleString()} seats · {zone.price.toLocaleString()} RWF
                    </div>
                    <div className="text-xs text-slate-500">Gate {zone.gate ?? "–"}</div>
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
              <p className="text-xs text-slate-400">No zones configured. Add your first zone below.</p>
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
                <PlusCircle className="h-3.5 w-3.5" /> Add or update zone
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={zoneName}
                  onChange={(event) => setZoneName(event.target.value)}
                  placeholder="North Stand"
                  className="bg-white/5 text-slate-100"
                  required
                />
                <Input
                  type="number"
                  min={0}
                  value={zoneCapacity}
                  onChange={(event) => setZoneCapacity(event.target.value)}
                  placeholder="Capacity"
                  className="bg-white/5 text-slate-100"
                  required
                />
                <Input
                  type="number"
                  min={0}
                  value={zonePrice}
                  onChange={(event) => setZonePrice(event.target.value)}
                  placeholder="Price"
                  className="bg-white/5 text-slate-100"
                  required
                />
                <Input
                  value={zoneGate}
                  onChange={(event) => setZoneGate(event.target.value)}
                  placeholder="Gate (optional)"
                  className="bg-white/5 text-slate-100"
                />
              </div>
              <Button type="submit" disabled={isMutating}>
                Save zone
              </Button>
            </form>
          )}
        </section>

        <section className="space-y-3">
          <header className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-100">Gates & Throughput</h3>
              <p className="text-xs text-slate-400">Coordinate stewarding targets ahead of matchday.</p>
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
                    <div className="text-xs text-slate-400">{gate.location ?? "No location set"}</div>
                    <div className="text-xs text-slate-500">Max throughput: {gate.maxThroughput ?? "—"} / hr</div>
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
              <p className="text-xs text-slate-400">No gates configured. Add throughput targets below.</p>
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
                <PlusCircle className="h-3.5 w-3.5" /> Add or update gate
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={gateName}
                  onChange={(event) => setGateName(event.target.value)}
                  placeholder="Gate A"
                  className="bg-white/5 text-slate-100"
                  required
                />
                <Input
                  value={gateLocation}
                  onChange={(event) => setGateLocation(event.target.value)}
                  placeholder="North concourse"
                  className="bg-white/5 text-slate-100"
                />
                <Input
                  type="number"
                  min={0}
                  value={gateThroughput}
                  onChange={(event) => setGateThroughput(event.target.value)}
                  placeholder="Max per hour"
                  className="bg-white/5 text-slate-100"
                />
              </div>
              <Button type="submit" disabled={isMutating}>
                Save gate
              </Button>
            </form>
          )}

          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
              <Activity className="h-3.5 w-3.5" /> Live scan metrics
            </div>
            {canManageGates ? (
              metricsLoading ? (
                <p className="mt-2 text-xs text-slate-400">Loading metrics…</p>
              ) : metrics.length ? (
                <ul className="mt-2 space-y-2 text-xs text-slate-300">
                  {metrics.map((metric) => (
                    <li key={metric.gate} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2">
                      <span className="font-medium text-slate-200">{metric.gate}</span>
                      <span className="text-slate-400">
                        {metric.total} scans · {metric.verified} ok · {metric.rejected} flagged
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-400">No scans recorded yet for this match.</p>
              )
            ) : (
              <p className="mt-2 text-xs text-slate-400">
                You need `gate:update` permission to view throughput metrics.
              </p>
            )}
          </div>
        </section>
      </GlassCard>
    </div>
  );
};

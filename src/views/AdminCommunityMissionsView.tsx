"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarClock, Flag, Loader2, PlusCircle, RefreshCw, StopCircle } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

import {
  fetchCommunityAdminMissions,
  createAdminQuiz,
  closeAdminQuiz,
  createAdminPrediction,
  closeAdminPrediction,
} from "@/lib/api/community";
import type { AdminQuizContract, AdminPredictionContract } from "@rayon/contracts";

const DEFAULT_REWARD = 20;

export default function AdminCommunityMissionsView() {
  const { toast } = useToast();
  const [quizForm, setQuizForm] = useState({ prompt: "", answer: "", reward: DEFAULT_REWARD, activeUntil: "" });
  const [predictionForm, setPredictionForm] = useState({ matchId: "", question: "", reward: 15, deadline: "" });

  const missionsQuery = useQuery({
    queryKey: ["community", "admin", "missions"],
    queryFn: fetchCommunityAdminMissions,
  });

  const createQuizMutation = useMutation({
    mutationFn: async () => {
      if (!quizForm.prompt.trim() || !quizForm.answer.trim()) {
        throw new Error("Prompt and answer are required");
      }
      const payload = {
        prompt: quizForm.prompt.trim(),
        correctAnswer: quizForm.answer.trim(),
        rewardPoints: Number.isFinite(quizForm.reward) ? quizForm.reward : DEFAULT_REWARD,
        activeUntil: quizForm.activeUntil ? new Date(quizForm.activeUntil).toISOString() : undefined,
      };
      const data = await createAdminQuiz(payload);
      setQuizForm({ prompt: "", answer: "", reward: DEFAULT_REWARD, activeUntil: "" });
      missionsQuery.refetch();
      toast({ title: "Quiz published", description: `Active from ${new Date(data.activeFrom).toLocaleString()}` });
      return data;
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to create quiz";
      toast({ title: "Quiz error", description: message, variant: "destructive" });
    },
  });

  const closeQuizMutation = useMutation({
    mutationFn: (quizId: string) => closeAdminQuiz(quizId),
    onSuccess: () => {
      missionsQuery.refetch();
      toast({ title: "Quiz closed" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to close quiz";
      toast({ title: "Quiz error", description: message, variant: "destructive" });
    },
  });

  const createPredictionMutation = useMutation({
    mutationFn: async () => {
      if (!predictionForm.matchId.trim() || !predictionForm.question.trim() || !predictionForm.deadline) {
        throw new Error("Match, question, and deadline are required");
      }
      const data = await createAdminPrediction({
        matchId: predictionForm.matchId.trim(),
        question: predictionForm.question.trim(),
        rewardPoints: Number.isFinite(predictionForm.reward) ? predictionForm.reward : 15,
        deadline: new Date(predictionForm.deadline).toISOString(),
      });
      setPredictionForm({ matchId: "", question: "", reward: 15, deadline: "" });
      missionsQuery.refetch();
      toast({ title: "Prediction scheduled", description: `Deadline ${new Date(data.deadline).toLocaleString()}` });
      return data;
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to schedule prediction";
      toast({ title: "Prediction error", description: message, variant: "destructive" });
    },
  });

  const closePredictionMutation = useMutation({
    mutationFn: (predictionId: string) => closeAdminPrediction(predictionId),
    onSuccess: () => {
      missionsQuery.refetch();
      toast({ title: "Prediction closed" });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Unable to close prediction";
      toast({ title: "Prediction error", description: message, variant: "destructive" });
    },
  });

  const data = missionsQuery.data;
  const quizzes = useMemo(() => data?.quizzes ?? [], [data?.quizzes]);
  const predictions = useMemo(() => data?.predictions ?? [], [data?.predictions]);
  const analytics = data?.analytics ?? { checkInsToday: 0, quizSubmissionsToday: 0, predictionsToday: 0 };

  return (
    <div className="min-h-screen pb-24 px-4">
      <div className="pt-8 pb-6 space-y-2">
        <h1 className="text-3xl font-black gradient-text">Fan Missions</h1>
        <p className="text-muted-foreground">Create quizzes and predictions to keep the leaderboard buzzing.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <GlassCard className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Check-ins today</p>
          <p className="text-2xl font-black text-primary">{analytics.checkInsToday}</p>
        </GlassCard>
        <GlassCard className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Quiz submissions today</p>
          <p className="text-2xl font-black text-primary">{analytics.quizSubmissionsToday}</p>
        </GlassCard>
        <GlassCard className="p-4 space-y-1">
          <p className="text-xs text-muted-foreground">Predictions today</p>
          <p className="text-2xl font-black text-primary">{analytics.predictionsToday}</p>
        </GlassCard>
      </div>

      <GlassCard className="mb-6 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Create quiz</h2>
            <p className="text-xs text-muted-foreground">Quizzes award bonus points once per fan.</p>
          </div>
        </div>
        <div className="grid gap-3">
          <Input
            value={quizForm.prompt}
            onChange={(event) => setQuizForm((prev) => ({ ...prev, prompt: event.target.value }))}
            placeholder="Prompt"
          />
          <Input
            value={quizForm.answer}
            onChange={(event) => setQuizForm((prev) => ({ ...prev, answer: event.target.value }))}
            placeholder="Correct answer"
          />
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              type="number"
              value={quizForm.reward}
              min={1}
              onChange={(event) => setQuizForm((prev) => ({ ...prev, reward: Number(event.target.value) }))}
              placeholder="Reward points"
            />
            <Input
              type="datetime-local"
              value={quizForm.activeUntil}
              onChange={(event) => setQuizForm((prev) => ({ ...prev, activeUntil: event.target.value }))}
              placeholder="Active until"
            />
          </div>
          <Button
            variant="hero"
            onClick={() => createQuizMutation.mutate()}
            disabled={createQuizMutation.isPending}
          >
            {createQuizMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Publishing…
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" /> Publish quiz
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="mb-6 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Schedule prediction</h2>
            <p className="text-xs text-muted-foreground">Predictions stay open until the configured deadline.</p>
          </div>
        </div>
        <div className="grid gap-3">
          <Input
            value={predictionForm.matchId}
            onChange={(event) => setPredictionForm((prev) => ({ ...prev, matchId: event.target.value }))}
            placeholder="Match ID (UUID)"
            className="font-mono"
          />
          <Input
            value={predictionForm.question}
            onChange={(event) => setPredictionForm((prev) => ({ ...prev, question: event.target.value }))}
            placeholder="Prediction question"
          />
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              type="number"
              min={1}
              value={predictionForm.reward}
              onChange={(event) => setPredictionForm((prev) => ({ ...prev, reward: Number(event.target.value) }))}
              placeholder="Reward points"
            />
            <Input
              type="datetime-local"
              value={predictionForm.deadline}
              onChange={(event) => setPredictionForm((prev) => ({ ...prev, deadline: event.target.value }))}
              placeholder="Deadline"
            />
          </div>
          <Button
            variant="hero"
            onClick={() => createPredictionMutation.mutate()}
            disabled={createPredictionMutation.isPending}
          >
            {createPredictionMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Scheduling…
              </>
            ) : (
              <>
                <CalendarClock className="w-4 h-4" /> Schedule prediction
              </>
            )}
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="mb-6 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Active quizzes</h2>
          <Button variant="glass" size="sm" onClick={() => missionsQuery.refetch()} disabled={missionsQuery.isFetching}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        {missionsQuery.isLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : quizzes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quizzes yet.</p>
        ) : (
          <div className="space-y-2">
            {quizzes.map((quiz) => (
              <QuizRow
                key={quiz.id}
                quiz={quiz}
                onClose={() => closeQuizMutation.mutate(quiz.id)}
                closing={closeQuizMutation.isPending}
              />
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Prediction fixtures</h2>
          <Button variant="glass" size="sm" onClick={() => missionsQuery.refetch()} disabled={missionsQuery.isFetching}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
        {missionsQuery.isLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : predictions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No fixtures yet.</p>
        ) : (
          <div className="space-y-2">
            {predictions.map((prediction) => (
              <PredictionRow
                key={prediction.id}
                prediction={prediction}
                onClose={() => closePredictionMutation.mutate(prediction.id)}
                closing={closePredictionMutation.isPending}
              />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

function QuizRow({ quiz, onClose, closing }: { quiz: AdminQuizContract; onClose: () => void; closing: boolean }) {
  const isExpired = quiz.activeUntil ? new Date(quiz.activeUntil) < new Date() : false;
  return (
    <div className="rounded-xl border border-border/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{quiz.prompt}</p>
          <p className="text-xs text-muted-foreground">Answer: {quiz.correctAnswer ?? 'Hidden'}</p>
          <p className="text-xs text-muted-foreground">
            Active from {new Date(quiz.activeFrom).toLocaleString()}
            {quiz.activeUntil ? ` · until ${new Date(quiz.activeUntil).toLocaleString()}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{quiz.rewardPoints} pts</span>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={closing || isExpired}>
            <StopCircle className="w-4 h-4" /> Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function PredictionRow({
  prediction,
  onClose,
  closing,
}: {
  prediction: AdminPredictionContract;
  onClose: () => void;
  closing: boolean;
}) {
  const deadline = new Date(prediction.deadline);
  const isClosed = deadline < new Date();
  return (
    <div className="rounded-xl border border-border/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{prediction.question}</p>
          <p className="text-xs text-muted-foreground">
            Match {prediction.matchId.slice(0, 8)}… · deadline {deadline.toLocaleString()}
          </p>
          {prediction.match ? (
            <p className="text-[11px] text-muted-foreground">
              vs {prediction.match.opponent} · {new Date(prediction.match.kickoff).toLocaleString()}
              {prediction.match.venue ? ` · ${prediction.match.venue}` : ''}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{prediction.rewardPoints} pts</span>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={closing || isClosed}>
            <Flag className="w-4 h-4" /> Close
          </Button>
        </div>
      </div>
    </div>
  );
}

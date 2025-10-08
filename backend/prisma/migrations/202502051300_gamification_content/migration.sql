CREATE TABLE "Quiz" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "prompt" TEXT NOT NULL,
  "correctAnswer" TEXT NOT NULL,
  "rewardPoints" INTEGER NOT NULL DEFAULT 20,
  "activeFrom" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "activeUntil" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "PredictionFixture" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "matchId" UUID NOT NULL,
  "question" TEXT NOT NULL,
  "rewardPoints" INTEGER NOT NULL DEFAULT 15,
  "deadline" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "PredictionFixture_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_prediction_fixture_deadline" ON "PredictionFixture"("deadline");

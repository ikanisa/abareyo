ALTER TABLE "Poll"
  ADD COLUMN "postId" UUID;

ALTER TABLE "Poll"
  ADD CONSTRAINT "Poll_postId_fkey"
  FOREIGN KEY ("postId") REFERENCES "Post"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE UNIQUE INDEX "Poll_postId_key" ON "Poll"("postId");

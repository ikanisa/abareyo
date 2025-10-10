Migrations Strategy

Baseline (if historical migrations are incomplete)

1) Create a squashed baseline migration from empty to current schema (no DB needed):

   cd backend
   npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/20251010_baseline_squash/migration.sql

   echo 'provider = "postgresql"' > prisma/migrations/migration_lock.toml

2) Commit the new migration folder.

3) In staging, apply with:

   npm run prisma:migrate

4) Seed:

   npm run seed

Evolving schema

- After the baseline, generate further incremental migrations from a dev DB:

  npm run prisma:dev -- --name <change-name>

- Commit the generated migration folder(s) and deploy with `npm run prisma:migrate`.

Notes

- Always run `npx prisma generate` after schema changes.
- Keep schema and migrations in lockstep; treat DB schema as part of the release artifact.


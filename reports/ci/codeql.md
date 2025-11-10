# CodeQL Analysis Status

- **Workflow**: `.github/workflows/security-scans.yml`
- **Job**: `codeql-analysis`
- **Languages**: JavaScript/TypeScript
- **Status**: ✅ Enabled in CI (runs on `push`, `pull_request`, and nightly schedule).

The job performs CodeQL initialization, autobuild, and analysis before dependency and container security scans. Results are uploaded to GitHub Security with write permissions.

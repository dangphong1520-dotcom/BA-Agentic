# GitHub and local development

Repository: https://github.com/dangphong1520-dotcom/BA-Agentic

## Windows startup

Install Node.js 24, pnpm 11.17.0 and Docker Desktop. Start Docker Desktop,
then run `pnpm local:start` from the repository root.

The command installs locked dependencies, preserves or creates local credentials,
starts PostgreSQL, applies pending migrations, seeds the local user and starts
the frontend, backend and worker. Open http://127.0.0.1:3000.
The backend listens on http://127.0.0.1:3001. Ctrl+C stops the applications.
The database volume remains available for subsequent runs; do not delete it.

Keep `.env` and `.env.local` private. They are intentionally excluded from Git.
The current UI uses development-only authentication. Production builds are
checked by CI, but the development login is disabled in production mode.

## CI and local delivery

GitHub Actions runs dependency installation, type checking, lint, unit tests,
PostgreSQL integration tests and production builds for pushes to main and PRs.
It uses an isolated, disposable database and never connects to local user data.

Local delivery is currently manual: wait for the target commit's CI to succeed,
stop the running applications, use GitHub Desktop to pull main (resolve or
commit local changes first), then run `pnpm local:start` again.
Back up important database data before applying new migrations.

There is no self-hosted runner or automatic deployment to the Windows PC yet.
GitHub Actions alone cannot start applications on this PC. Automatic local
deployment requires a separately configured runner or local update service.

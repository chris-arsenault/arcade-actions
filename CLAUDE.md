# Arcade Actions

## Critical rules

- Read `../ahara/INTEGRATION.md`, `../ahara/CI-WORKFLOW.md`, and the applicable
  `../ahara-standards/standards/` documents before changing platform integration.
- Keep workflows simulated until live GitHub integration is explicitly requested.
  Do not imply that the UI executes code, creates real artifacts, or deploys a service.
- Keep data and synthesized artwork/sound in the browser. No backend, database,
  authentication, telemetry, or external asset service is required by this shell.
- Use native agent editing tools for authored file changes.
- Do not create branches, commit, push, or deploy without user authorization.
- Run `make ci` before committing. Keep generated output in ignored directories.
- Use `with-cred --` for credential-backed commands in the Sulion environment;
  other installations may provide credentials through standard environment variables.

## Project overview

A GitHub Actions UI shell that represents workflow jobs as Mario platforms and
connecting pipes. Run scheduling follows dependency edges and exposes parallel
execution, failures, skipped jobs, cancellation, and re-runs through demo data.

## Code layout

| Path                                              | Purpose                                               |
| ------------------------------------------------- | ----------------------------------------------------- |
| `frontend/src/types.ts`                           | Workflow, job, run, artifact, and UI state types      |
| `frontend/src/workflows.ts`                       | Three fixed demonstration workflows                   |
| `frontend/src/model.ts`                           | Dependency scheduling and simulation transitions      |
| `frontend/src/state.ts`                           | Browser session state and run filtering               |
| `frontend/src/view*.ts`, `logs.ts`                | Navigation, course, details, and log rendering        |
| `frontend/src/controls.ts`, `render.ts`, `dom.ts` | Events, redraw/focus handling, DOM helpers            |
| `frontend/src/artwork.ts`, `styles.css`           | Pixel sprites, optional synthesized audio, styling    |
| `frontend/src/main.ts`                            | Browser entry and simulation timer                    |
| `infrastructure/terraform/`                       | S3/CloudFront website, DNS, TLS, and response headers |
| `scripts/deploy.sh`                               | Local build/check/apply entry point                   |
| `platform.yml`, `.github/workflows/ci.yml`        | Ahara stack declaration and shared CI                 |

## Architecture patterns

The frontend uses strict TypeScript and browser DOM APIs without a UI framework.
Vite emits content-hashed assets so CloudFront's immutable asset caching is safe.
The model has no browser dependency; Vitest covers simulation behavior.
Runs live only in memory and reset on reload. No backend packages, Lambdas,
database migrations, database queries, or Cognito client exist.

Ahara's shared `website` module hosts the built frontend in private S3 behind
CloudFront. Use SSE-S3 encryption (`AES256`), with optional module KMS disabled.
The deployer registration belongs in
`../ahara-infra/infrastructure/terraform/control/project-arcade-actions.tf`.
Apply that registration before the application's first deployment. It provisions
the OIDC deployer role and GitHub Actions repository secrets.

The frontend CSP prohibits network connections. Inline styles support generated
platform coordinates; scripts load only from the site's own origin.

## Development commands

| Command        | Purpose                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| `make install` | Install the pinned pnpm dependency graph                                |
| `make dev`     | Start the development UI on loopback port 26000 when requested          |
| `make ci`      | Lint, typecheck, coverage tests, formatting, build, mock Terraform plan |
| `make build`   | Build `frontend/dist/`                                                  |
| `make preview` | Serve the production build on loopback port 26000 when requested        |
| `make format`  | Format source and Terraform                                             |
| `make deploy`  | Check/build and apply app infrastructure using local credentials        |

CI calls Ahara's reusable workflow directly and does not invoke the local deploy
script. The shared workflow deploys `main` only. Terraform state uses
`projects/arcade-actions.tfstate` in the shared platform bucket.

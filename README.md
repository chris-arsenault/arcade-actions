# Arcade Actions

A GitHub Actions UI shell with Mario moving through job platforms and pipelines.
Parallel jobs run together, dependent jobs wait, and successful runs reach the
finish flag. The interface is branded Actions Arcade.

## Local development

Use Node.js 24.19.0, pnpm 10.29.3, and Terraform 1.14 or newer.

```sh
make install
make dev
```

Open `http://127.0.0.1:26000`. Stop the server with Ctrl+C.
`make build` creates `frontend/dist/`; `make preview` serves that production build.

Choose a workflow or recent run, then select a platform to inspect its steps and
logs. **Run workflow** starts a new simulation; **Re-run** retries the selected
workflow and commit with a new run number. Pause freezes the selected run, and
cancellation stops its unfinished jobs. Other active runs continue when you
switch views. Simulations stop advancing while the browser tab is hidden.

The three workflows demonstrate a branching build-and-deploy pipeline, a pull
request preview, and a dependency scan with a recorded failure. Re-running the
failed scan demonstrates recovery with a passing simulation. Search matches run
numbers, workflow names, commit titles, and branches. Press `/` to focus search
and Escape to clear it. Details tabs support arrow keys, Home, and End.

## Architecture

Strict TypeScript modules implement the browser UI and simulation. Vite builds
the frontend with content-hashed JavaScript and CSS. All data stays in memory
and resets on reload. Artwork and optional sound are drawn or synthesized in
the browser; animation respects the reduced-motion preference.

The UI uses demo data. It does not connect to GitHub, execute code, or deploy an
application. Logs and artifact sizes are simulated. Artifact downloads contain
a JSON manifest rather than a compiled bundle. There is no backend, database,
login, telemetry, or remote asset dependency.

Ahara's shared `website` Terraform module serves `frontend/dist/` from private
S3 through CloudFront, using SSE-S3 encryption, a DNS-validated TLS certificate,
and the existing `ahara.io` hosted zone. The hosting CSP blocks network
connections and permits scripts only from the application's own origin.

## Checks

```sh
make ci
```

This runs Ahara ESLint rules, strict TypeScript checks, Vitest with coverage and
JUnit output, formatting checks, the production build, and a Terraform plan
using mocked AWS providers. Generated output is ignored by Git. No cloud
credentials are needed for these checks.

## Deployment

Configured application URL: `https://arcade-actions.ahara.io`.
No API URL is configured because the shell has no backend. The URL is available
after the first successful infrastructure deployment.

First apply the registration in the peer `ahara-infra` repository:
`infrastructure/terraform/control/project-arcade-actions.tf`. This provisions
the project OIDC role and the GitHub Actions `OIDC_ROLE`, `STATE_BUCKET`, and
`PREFIX` secrets. The registration grants the shared website bundle and
project-scoped Terraform state access.

The project's `.github/workflows/ci.yml` calls Ahara's shared reusable workflow.
It reads `platform.yml`, runs frontend and Terraform checks, sends engineering
reports through Ahara, and builds/applies on `main`. Local deployment uses:

```sh
with-cred -- make deploy
```

`with-cred` supplies credentials in the Sulion environment. Elsewhere, provide
ordinary AWS credentials and run `make deploy`. The script accepts no arguments,
checks and builds the project, and applies Terraform. `STATE_BUCKET` and
`STATE_REGION` may override the shared defaults. The app state key is
`projects/arcade-actions.tfstate`.

## License

Project code is licensed under [MIT](LICENSE).

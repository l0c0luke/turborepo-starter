---
name: infrastructure
description: Manage cloud infrastructure for this repo with Terraform — the infra/ layout, remote state, OIDC credentials, plan-on-PR / apply-from-CI, Terraform tests, and the fmt/validate/tflint/trivy gate. Use whenever a project deploys to a cloud provider (AWS, GCP, Azure, Cloudflare, Hetzner, DigitalOcean, …) or a feature needs a cloud resource (bucket, database, queue, DNS record, CDN, IAM role, secret, VM).
---

# Infrastructure (Terraform)

Rule (AGENTS.md → Infrastructure): **if the project deploys to a cloud
provider, everything in that account is Terraform in `infra/`.** That
includes the VM a self-hosted PaaS such as Coolify runs on, managed Postgres,
buckets, DNS, CDN, networks, IAM and secrets. Nothing is created in a web
console or by a CLI `create`/`delete` script, and nothing uses CDK, Pulumi,
CloudFormation/SAM, Serverless or Bicep. A project that only uses a PaaS
(Coolify on a server you didn't provision, Vercel) has no `infra/` until it
creates its first cloud resource.

Write HCL with the **terraform-style-guide** skill and tests with the
**terraform-test** skill. Review IAM, network exposure and data storage with
the **security-audit** skill.

## Layout (enforced by `pnpm check:conventions`, rule `terraform`)

```
infra/
  .terraform-version        # exact Terraform version, e.g. 1.17.2 (CI installs it; tfenv reads it)
  .tflint.hcl               # tflint config + the provider ruleset plugin
  modules/<name>/           # reusable modules: main.tf, variables.tf, outputs.tf, versions.tf
    tests/<name>.tftest.hcl # required — mock_provider tests, run offline in CI
  envs/<env>/               # root modules (staging, production): compose modules
    backend.tf              # remote state — required, never "local"
    .terraform.lock.hcl     # provider lock — committed
    providers.tf, main.tf, variables.tf, outputs.tf
```

- Terraform files anywhere else fail the check, as do committed state,
  plans and `.terraform/` (`.gitignore` covers them).
- Environments differ only in variables. Put shared shape in a module
  rather than copying resources between `envs/*` (fix once).
- Pin providers with `~>` in `required_providers`. Commit each root module's
  `.terraform.lock.hcl` after `terraform init`. Renovate groups provider and
  CLI bumps into one `terraform` PR.

## Remote state

Each root module declares a remote backend: S3 with `use_lockfile = true`,
GCS, `azurerm`, or an HCP Terraform `cloud {}` block. State never lives on a
laptop. The state bucket has a chicken-and-egg problem; solve it once:

1. `infra/envs/bootstrap/`: the state bucket (versioned, encrypted, public
   access blocked) and the CI deploy role (below). Apply it once locally with
   the backend block commented out.
2. Uncomment the backend (pointing at the bucket it just created) and run
   `terraform init -migrate-state`. Then commit; from now on it is a normal
   remote-state root module.

## Credentials

- **CI uses OIDC**, never long-lived keys: a GitHub Actions OIDC trust on an
  AWS IAM role, GCP Workload Identity Federation, or an Azure federated
  credential, scoped to this repo and to the `main` branch / `production`
  environment. Create it in `envs/bootstrap`.
- Locally, use the provider's SSO login (`aws sso login`, `gcloud auth
  application-default login`, `az login`).
- Secrets the infrastructure needs come from `sensitive = true` variables fed
  by `TF_VAR_*` in CI (GitHub environment secrets), or are generated in
  Terraform and written to the provider's secrets manager. Never put them in
  `.tf` files or committed `*.tfvars`: the conventions check rejects literal
  credentials and gitleaks scans all history.

## Changes go through CI

When the project adopts a provider, add `.github/workflows/infra.yml`:

- **Pull request** touching `infra/**`: `terraform plan` for each env, with
  the plan in the job summary (OIDC role with read-only permissions).
- **Push to `main`**: `terraform apply` per env, behind a GitHub
  **Environment** (`production` requires a reviewer). The apply role is the
  only principal allowed to change the account.
- **Weekly schedule**: `terraform plan -detailed-exitcode` per env. Exit
  code 2 means drift; fail the job so someone notices console changes.

Local `terraform apply` is for `envs/bootstrap` only.

## The gate (`pnpm check:infra`, CI job `infra`)

`scripts/check-infra.ts` runs once `infra/` has Terraform:

1. `terraform fmt -check -recursive`
2. `init -backend=false` + `validate` for every env and module (no
   credentials needed; envs use `-lockfile=readonly`)
3. `terraform test` for every module
4. `tflint --recursive` (configure the provider ruleset in `infra/.tflint.hcl`,
   e.g. `plugin "aws" { enabled = true, version = "…", source = "github.com/terraform-linters/tflint-ruleset-aws" }`)
5. `trivy config`: HIGH/CRITICAL misconfigurations fail. Fix them. To accept
   one deliberately, add a `#trivy:ignore:<ID>` comment with the reason on the
   line above the resource.

Install `terraform` (or `tfenv`), `tflint` and `trivy` locally. Without them
`pnpm check` warns and skips; CI installs pinned versions and fails on any
step.

## Adding a resource for a feature

1. Add it to the right module, or create a module with a test (`mock_provider`
   + `command = plan` asserting the important attributes: encryption on,
   public access off, names).
2. Wire it into each `envs/<env>` with environment-specific variables.
3. Expose what the app needs (bucket name, queue URL) as outputs. Set them as
   app env vars in the deploy platform and in `.env.example`, validated in
   `apps/nextjs/src/env.ts`. Never hardcode ARNs or IDs in app code.
4. `pnpm check` (includes `check:infra`), open the PR, read the plan in CI,
   merge to apply.

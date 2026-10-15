#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT_DIR}/infrastructure/terraform"
STATE_BUCKET="${STATE_BUCKET:-tfstate-559098897826}"
STATE_REGION="${STATE_REGION:-us-east-1}"

make -C "${ROOT_DIR}" install ci

terraform -chdir="${TF_DIR}" init -reconfigure -input=false \
  -backend-config="bucket=${STATE_BUCKET}" \
  -backend-config="region=${STATE_REGION}" \
  -backend-config="use_lockfile=true"

terraform -chdir="${TF_DIR}" apply -auto-approve -input=false

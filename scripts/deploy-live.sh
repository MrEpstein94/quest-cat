#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Load the user's shell exports when the script is launched by npm/non-interactive shells.
if [[ -f "$HOME/.zshrc" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.zshrc"
fi

if [[ -f "$HOME/.zprofile" ]]; then
  # shellcheck disable=SC1090
  source "$HOME/.zprofile"
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Working tree is not clean. Commit your changes before running deploy:live." >&2
  exit 1
fi

CURRENT_BRANCH="$(git branch --show-current)"
if [[ "$CURRENT_BRANCH" != "main" ]]; then
  echo "deploy:live must be run from main. Current branch: $CURRENT_BRANCH" >&2
  exit 1
fi

if [[ -z "${RENDER_DEPLOY_HOOK_URL:-}" ]]; then
  echo "RENDER_DEPLOY_HOOK_URL is not set." >&2
  exit 1
fi

echo "Pushing main to origin..."
git push origin main

echo "Triggering Render deploy hook..."
curl --fail --silent --show-error -X POST "$RENDER_DEPLOY_HOOK_URL"

echo
echo "Live deploy triggered."

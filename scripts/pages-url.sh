#!/usr/bin/env bash
set -euo pipefail

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) is required. Install: https://cli.github.com/"
  exit 1
fi

remote_url=$(git config --get remote.origin.url || true)
if [[ -z "$remote_url" ]]; then
  echo "No 'origin' remote found. Push your repo first."
  exit 1
fi

# Supports both SSH and HTTPS remotes.
if [[ "$remote_url" =~ github.com[:/]([^/]+)/([^/.]+)(\.git)?$ ]]; then
  owner="${BASH_REMATCH[1]}"
  repo="${BASH_REMATCH[2]}"
else
  echo "Could not parse owner/repo from origin: $remote_url"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Not authenticated with GitHub CLI. Run: gh auth login"
  exit 1
fi

pages_url=$(gh api "repos/$owner/$repo/pages" --jq '.html_url' 2>/dev/null || true)

if [[ -n "$pages_url" ]]; then
  echo "$pages_url"
  exit 0
fi

echo "GitHub Pages URL is not available yet."
echo "If this is a new repo, wait for the deploy workflow to finish and try again."

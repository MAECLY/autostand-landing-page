#!/usr/bin/env bash
#
# Vercel install step.
#
# `@autostand/ui` lives in the private repository MAECLY/autostand-ui and
# pnpm-lock.yaml pins it over SSH. Vercel's build container has no key for it,
# so git is rewritten to fetch over HTTPS with a token instead.
#
# This lives in a file rather than inline in vercel.json because Vercel caps
# `installCommand` at 256 characters and the rewriting alone is twice that.
set -euo pipefail

if [ -z "${UI_REPO_TOKEN:-}" ]; then
  echo "UI_REPO_TOKEN is not set, so git cannot fetch the private @autostand/ui." >&2
  echo "Add it as an environment variable in the Vercel project — see README.md → Deploying to Vercel." >&2
  exit 1
fi

rewrite="https://x-access-token:${UI_REPO_TOKEN}@github.com/"

# --add rather than a plain set: insteadOf is multi-valued, and a second plain
# `git config` would replace the first instead of appending to it. All three
# spellings are covered because pnpm pinned the dependency over SSH and a future
# re-resolve could emit either of the other two.
git config --global url."${rewrite}".insteadOf "ssh://git@github.com/"
git config --global --add url."${rewrite}".insteadOf "git@github.com:"
git config --global --add url."${rewrite}".insteadOf "https://github.com/"

pnpm install --frozen-lockfile

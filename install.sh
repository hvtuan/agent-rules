#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_SRC="$SCRIPT_DIR/qc-automation"
SKILL_NAME="qc-automation"
POINTER='When writing/editing test automation, you MUST use the `qc-automation` skill.'

usage() {
  cat >&2 <<EOF
Usage: install.sh <mode> [path]
  --global              Symlink the skill into ~/.claude/skills/$SKILL_NAME
  --project <path>      Copy the skill into <path>/.claude/skills/$SKILL_NAME and
                        add a pointer line to <path>/CLAUDE.md
  --starter <path>      Copy starter-pack/* into <path> (use --force to overwrite)
EOF
  exit 2
}

install_global() {
  local dest="$HOME/.claude/skills/$SKILL_NAME"
  mkdir -p "$HOME/.claude/skills"
  if [ -e "$dest" ] && [ ! -L "$dest" ]; then
    echo "Refusing: $dest exists and is not a symlink. Remove it first." >&2; exit 1
  fi
  ln -sfn "$SKILL_SRC" "$dest"
  echo "Linked $dest -> $SKILL_SRC"
  echo "Verify: ls -l '$dest' ; then open Claude Code and ask it to write a Playwright test."
}

install_project() {
  local path="${1:-}"; [ -n "$path" ] || usage
  local dest="$path/.claude/skills/$SKILL_NAME"
  mkdir -p "$path/.claude/skills"
  rm -rf "$dest"
  cp -R "$SKILL_SRC" "$dest"
  local claudemd="$path/CLAUDE.md"
  touch "$claudemd"
  if ! grep -qF 'qc-automation` skill' "$claudemd"; then
    printf '\n%s\n' "$POINTER" >> "$claudemd"
  fi
  echo "Installed skill to $dest and ensured pointer in $claudemd"
  echo "Next: commit .claude/ and CLAUDE.md into your test repo so the team gets it."
}

install_starter() {
  local path="${1:-}"; [ -n "$path" ] || usage
  local force="${2:-}"
  mkdir -p "$path"
  local copy_args=(-R)
  [ "$force" = "--force" ] || copy_args+=(-n)
  cp "${copy_args[@]}" "$SKILL_SRC/starter-pack/." "$path/" 2>/dev/null || \
    cp -R "$SKILL_SRC/starter-pack/." "$path/"
  echo "Copied starter-pack into $path"
  echo "Next: npm i -D eslint eslint-plugin-playwright @typescript-eslint/eslint-plugin husky lint-staged ; npx husky init ; enable ci/qc.yml"
}

case "${1:-}" in
  --global)  install_global ;;
  --project) install_project "${2:-}" ;;
  --starter) install_starter "${2:-}" "${3:-}" ;;
  *)         usage ;;
esac

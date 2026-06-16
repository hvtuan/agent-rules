#!/usr/bin/env bash
# Minimal assertion harness for install.sh — no external deps.
set -u
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PASS=0; FAIL=0
ok()   { PASS=$((PASS+1)); echo "ok - $1"; }
no()   { FAIL=$((FAIL+1)); echo "NOT OK - $1"; }
check(){ if eval "$2"; then ok "$1"; else no "$1"; fi; }

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
export HOME="$TMP/home"; mkdir -p "$HOME"

"$ROOT/install.sh" >/dev/null 2>&1; check "no args exits non-zero" "[ $? -ne 0 ]"

PROJ="$TMP/proj"; mkdir -p "$PROJ"
"$ROOT/install.sh" --project "$PROJ" >/dev/null 2>&1
check "project: skill copied"        "[ -f '$PROJ/.claude/skills/qc-automation/SKILL.md' ]"
check "project: CLAUDE.md created"   "[ -f '$PROJ/CLAUDE.md' ]"
check "project: pointer present"     "grep -q 'qc-automation' '$PROJ/CLAUDE.md'"
"$ROOT/install.sh" --project "$PROJ" >/dev/null 2>&1
COUNT=$(grep -c 'MUST use the' "$PROJ/CLAUDE.md")
check "project: pointer not duplicated" "[ '$COUNT' -eq 1 ]"

"$ROOT/install.sh" --global >/dev/null 2>&1
check "global: symlink exists" "[ -L '$HOME/.claude/skills/qc-automation' ]"

TREPO="$TMP/trepo"; mkdir -p "$TREPO"
"$ROOT/install.sh" --starter "$TREPO" >/dev/null 2>&1
check "starter: eslint config copied" "[ -f '$TREPO/eslint/eslint.config.js' ]"

echo "----"; echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]

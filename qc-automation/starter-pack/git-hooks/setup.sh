#!/usr/bin/env bash
set -euo pipefail
# Install husky and register the QC pre-commit hook in the current repo.
npx husky init
cp "$(dirname "$0")/pre-commit" .husky/pre-commit
chmod +x .husky/pre-commit
echo "Husky pre-commit installed. Pre-push smoke: add 'npx playwright test --grep @smoke' to .husky/pre-push."

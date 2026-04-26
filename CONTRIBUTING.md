# Contributing to Noirable

Thanks for your interest. The full developer workflow, code style, testing
patterns, commit conventions, and troubleshooting notes live in
[`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

A short version:

1. **Setup**: `pnpm install`, set at least one provider key in `.env.local`,
   then `pnpm dev`.
2. **Local gate**: `pnpm check` runs prettier, eslint, stylelint, vitest, and
   the production build. CI runs the same plus `pnpm e2e`.
3. **Commits**: small, focused commits with clear messages. The pre-commit
   hook runs `lint-staged` (prettier + eslint + stylelint) on changed files.
4. **Tests**: keep the line/statement coverage threshold (70%) intact. New
   protocol behavior should land with a Vitest spec next to the code.
5. **Pull requests**: target `main`. Include a short summary and a test plan
   in the PR description.

Issues and PRs are welcome. For larger changes, open an issue first to discuss
the approach.

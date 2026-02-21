# AGENTS.md

This file defines repository-level operating rules for AI agents working in this project.

## Communication

- Use English for chat interactions, repository files, and documentation by default.

## General Rules

- Use Conventional Commits for commit messages. If uncertain, inspect recent commit history first.
- If a user writes `#{number}`, treat it as a GitHub Issue number and use `gh` when issue operations are needed.
- For GitHub Actions, always use the latest major version of `actions/*`.
- In Codex, refer to `ai-rules/` (symlink to `~/.config/ai/rules`) when rule context is needed.

## Skills Policy

- Store Codex skills directly under `./skills/` (one-level depth).
- Store user-created skills directly under `./skills/` (one-level depth).
- Store Claude skills directly under `./skills/` (one-level depth).
- Treat each `SKILL.md` as a living document: update when new findings, deprecations, or version changes are confirmed.
- When updating a skill, edit the chezmoi-managed source in this repository, not deployed copies like `~/.agents/skills/**` or `~/.config/ai/skills/**`.
- After changing chezmoi-managed files, run `chezmoi apply` to synchronize actual files.
- For skill maintenance work, following `$chezmoi-ops` is recommended.

## Git / Workflow Rules

- Keep workflows as git-light as possible. Do not run `git status`, `git commit`, or `git push` unless the user explicitly asks.
- Exception: if chezmoi-managed source files are changed, automatic `git add/commit/push` is allowed when necessary unless the user explicitly opts out.
- Prefer `chezmoi apply` / `chezmoi update` over direct git operations for synchronization.

### Additional rules for git worktree usage

- Commit and push promptly in worktree-based tasks.
- If `lefthook` fails, fix the issues before continuing.
- Before pushing from a worktree, always run:
  - `git fetch origin develop --prune`
  - `git rebase origin/develop`
- If rebase conflicts occur, resolve them and finish rebase before pushing.
- Create PRs only after rebase is complete.
- After push, create a Draft PR by default.
- Once implementation is complete and CI is green, either mark PR as ready for review or ask the user first (only switch when user approves).
- After creating a PR, run `gh run watch` and respond to CI failures/conflicts.

## Secrets / Environment

- Do not rely on `.env` by default.
- Prefer AWS Secrets Manager or Doppler for secrets management.
- In polyrepo/monorepo contexts, `dotenvx` may be used when appropriate.

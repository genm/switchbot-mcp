## Summary

- What changed and why.

## Change Type

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] CI/DevEx

## Risk & Irreversible Check

- [ ] No irreversible change (`migrations/auth/infra/config/contract`) included
- [ ] If irreversible, `manual-review` label added and reason documented

## Validation

- [ ] `npm run typecheck`
- [ ] `npm run lint`
- [ ] `npm run format`
- [ ] `npm run test`
- [ ] `npm run build`

## Branch/Flow Compliance

- [ ] Base branch is `integration` (except promotion PR: `integration -> main`)
- [ ] No direct merge to `main`
- [ ] Rebased on latest `origin/integration` before push

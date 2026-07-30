## Summary

- What changed and why.

## Change Type

- [ ] Feature
- [ ] Fix
- [ ] Refactor
- [ ] Docs
- [ ] CI/DevEx

## Risk

- [ ] Security, protocol contract, transport, and release risks are documented
- [ ] No credentials or live device data are included

## Validation

- [ ] `npm run check`
- [ ] A realistic failure or degraded path was exercised
- [ ] `npm run test:coverage` when application behavior changed
- [ ] `npm run smoke:container` when runtime/container behavior changed

## Branch/Flow Compliance

- [ ] Base branch is `main`
- [ ] PR is Draft until it is ready for the complete CI matrix
- [ ] Rebased on latest `origin/main` before push

Summary of the change, with a little context: what it does and why.

## Checklist

- [ ] `npm run build && npm run demo:build` then `npm run check:classes`, `check:package`, `check:size` pass locally
- [ ] Tests cover the change (`npm test`)
- [ ] The [API summary](./api-summary.md) and the [AI setup prompt](./agent-setup.md) still list every public name
      (`npm run check:api-summary`)
- [ ] [CHANGELOG.md](../CHANGELOG.md) has an entry under the next version
- [ ] Size budgets in `scripts/check-size.mjs` were only raised deliberately, with the reason in the commit message

## Kind of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation only

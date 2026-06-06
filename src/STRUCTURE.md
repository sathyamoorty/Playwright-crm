# Framework Structure

```
RSAUTOMATION/
├── artifacts/                  # Generated outputs
│   └── screenshots/
├── src/                        # All framework source code
│   ├── data/                   # Test data (JSON)
│   ├── fixtures/               # Step 5 — Playwright fixtures (auth, pages)
│   ├── validators/             # Step 7 — Assertions
│   ├── pages/                  # Step 3 — Page Objects
│   │   ├── auth/
│   │   ├── capture/capture-modules/  # locators/ + actions/
│   │   ├── dashboard/
│   │   ├── modules/
│   │   ├── related/
│   │   ├── quick-actions/
│   │   └── workflows/
│   └── utils/
│       ├── helpers/            # Shared utilities
│       └── reporting/          # Step 8 — Custom reporters
├── tests/                      # Step 2 — Test specs (by feature)
│   ├── auth/
│   ├── capture/
│   ├── modules/
│   ├── workflows/
│   └── quick-actions/
├── playwright.config.ts
└── package.json
```

## 8-Step Playwright Flow

| Step | Layer | Location |
|------|-------|----------|
| 1 | User Action | `npm run test:*` |
| 2 | Test Spec | `tests/` |
| 3 | Page Object | `src/pages/` |
| 4 | Locator + Actions | `src/pages/**/locators`, `actions/` |
| 5 | Fixtures | `src/fixtures/` |
| 6 | UI Interaction | Page object methods |
| 7 | Validation | `src/validators/` |
| 8 | Report | `src/utils/reporting/` |

## Path Aliases (tsconfig)

- `@fixtures` → `src/fixtures`
- `@pages/*` → `src/pages/*`
- `@utils/helpers/*` → `src/utils/helpers/*`
- `@utils/reporting/*` → `src/utils/reporting/*`
- `@data/*` → `src/data/*`
- `@validators/*` → `src/validators/*`

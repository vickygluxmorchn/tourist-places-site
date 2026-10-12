# Wanderly - Tourist Places Explorer

A tourist places website with a serverless API, automated tests, a build step, integration tests (all run by GitHub Actions) and automatic deployment to Vercel.

## API

| Endpoint | Description |
|---|---|
| `GET /api/places` | List places. Optional: `q`, `category`, `sort` (`rating` or `name`) |
| `GET /api/places?id=taj-mahal` | One place |
| `GET /api/health` | Health check |

Place data lives in `data/places.json` (sample data, edit freely).

## Scripts

| Command | What it does |
|---|---|
| `npm run lint` | Syntax-checks every JS file and validates the JSON files |
| `npm test` | Unit tests |
| `npm run build` | Validates the site and writes it to `dist/` with `build-info.json` |
| `npm run test:integration` | Starts the app and runs smoke tests over HTTP |
| `npm run ci` | Runs all four steps above, exactly like GitHub Actions |
| `npm start` | Runs the site locally at http://localhost:3000 |

## Branches and CI/CD (`.github/workflows/ci-cd.yml`)

Nobody commits to `main` directly. Changes go through `develop` first:

```
feature branch (optional)
        |  pull request
        v
     develop  --> Lint, Test (Node 20/22/24), Build, Integration tests --> Staging preview
        |  you check the staging preview and confirm
        |  pull request develop -> main
        v
      main    --> same checks --> Production deploy
```

| Event | What runs |
|---|---|
| Push to `develop` | Lint, tests, build, integration tests, then a staging preview deploy (link in the run summary) |
| Pull request (to `develop` or `main`) | Same checks, then a preview deploy with the link posted on the PR |
| Push to `main` (merge of develop) | Same checks, then the production deploy |

Required GitHub repository secrets for deployment: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.

Vercel's own Git deployments are switched off in `vercel.json` so GitHub Actions is the only deployer.

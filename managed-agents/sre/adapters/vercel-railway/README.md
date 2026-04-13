# Vercel + Railway Adapter

Monitors Vercel frontend deployments and Railway backend services.

## Required Environment Variables

| Variable | Purpose |
|----------|---------|
| `VERCEL_TOKEN` | Vercel API authentication |
| `RAILWAY_TOKEN` | Railway API authentication |

## Log Sources

| Source | API | Endpoint |
|--------|-----|----------|
| build | Vercel | `GET /v6/deployments/{id}/events` |
| runtime | Railway | GraphQL `deploymentLogs` |
| system | Both | Combined and sorted by timestamp |

## Health Checks

HTTP GET to each endpoint in `health_endpoints` config. Expects 200 status.

## Smoke Tests

Executes each test in `smoke_tests` config:
- `method`: HTTP method (GET, POST)
- `url`: Full URL to test
- `expect_status`: Expected HTTP status code

# SRE Adapters

Each adapter implements the `SREAdapter` interface from `adapter-interface.ts`.

## Available Adapters

| Adapter | Target | Status |
|---------|--------|--------|
| `vercel-railway/` | Vercel (frontend) + Railway (backend) | Stub |
| `raspberry-pi/` | Raspberry Pi via SSH | Stub |
| `macos-desktop/` | macOS Swift/Xcode builds | Stub |

## Shared Utilities

| File | Purpose |
|------|---------|
| `shared/trigger-iterate-suggestion.ts` | Writes iterate suggestion to sprint file |

## Adding a New Adapter

1. Create a directory under `adapters/`
2. Implement the `SREAdapter` interface in `index.ts`
3. Add the target name to `adapter-interface.ts` union type
4. Register in `bridge/adapter-loader.ts`

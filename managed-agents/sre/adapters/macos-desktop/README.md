# macOS Desktop Adapter

Monitors macOS desktop application builds (Swift/Xcode).

## Build Systems

| System | Config Value | Command |
|--------|-------------|---------|
| Swift Package Manager | `swift` | `swift build` |
| Xcode | `xcode` | `xcodebuild -scheme X build` |

## Smoke Tests

| Type | How |
|------|-----|
| `swift-build` | Run `swift build` in project directory |
| `xcode-build` | Run `xcodebuild -scheme X build` |
| `process-check` | `pgrep -x "ProcessName"` |

## Log Sources

| Source | Location |
|--------|----------|
| build | Swift/Xcode build output (captured during smoke test) |
| runtime | `log show --predicate 'process == "AppName"' --last 5m` |

# OTel Log Beautifier

Beautifies OpenTelemetry JSON structured logs directly in the VS Code integrated terminal. No piping, no separate panels, no modified run commands. Open a terminal, run your service, and JSON log lines become colorized, structured output automatically.

## Before / After

**Before** — raw NDJSON from an OpenTelemetry-instrumented service:

```json
{"timestamp":"2026-04-11T22:51:12.800Z","level":"info","message":"Request received","severity_number":9,"severity_text":"INFO","resource":{"service.name":"api-gateway","service.version":"1.4.0","deployment.environment":"production"},"context":{"requestId":"req_7f3a2b1c","userId":"usr_a8d4e9","path":"/v1/orders"}}
{"timestamp":"2026-04-11T22:51:12.912Z","level":"info","message":"Order validated","severity_number":9,"severity_text":"INFO","resource":{"service.name":"api-gateway","service.version":"1.4.0","deployment.environment":"production"},"context":{"requestId":"req_7f3a2b1c","orderId":"ord_bf82c4","itemCount":3}}
{"timestamp":"2026-04-11T22:51:13.204Z","level":"warn","message":"Payment gateway slow response","severity_number":13,"severity_text":"WARN","resource":{"service.name":"api-gateway","service.version":"1.4.0","deployment.environment":"production"},"context":{"requestId":"req_7f3a2b1c","gateway":"stripe","elapsedMs":1842}}
{"timestamp":"2026-04-11T22:51:13.567Z","level":"error","message":"Inventory check failed","severity_number":17,"severity_text":"ERROR","resource":{"service.name":"api-gateway","service.version":"1.4.0","deployment.environment":"production"},"context":{"requestId":"req_7f3a2b1c","sku":"SKU-1234","reason":"downstream_timeout"}}
```

**After** — same logs, beautified. Timestamps shortened, service name pulled out, context indented, repeated resource blocks suppressed, level colors (dim for INFO, yellow for WARN, red for ERROR):

```
22:51:12.800  INFO   [api-gateway]  Request received
    requestId: req_7f3a2b1c
    userId:    usr_a8d4e9
    path:      /v1/orders

22:51:12.912  INFO   [api-gateway]  Order validated
    requestId:  req_7f3a2b1c
    orderId:    ord_bf82c4
    itemCount:  3

22:51:13.204  WARN   [api-gateway]  Payment gateway slow response
    requestId: req_7f3a2b1c
    gateway:   stripe
    elapsedMs: 1842

22:51:13.567  ERROR  [api-gateway]  Inventory check failed
    requestId: req_7f3a2b1c
    sku:       SKU-1234
    reason:    downstream_timeout
```

Non-JSON output (shell prompts, `ls`, `git status`, compiler warnings) passes through unchanged.

## Features

- **Automatic JSON detection** — JSON log lines get formatted, everything else passes through
- **Multi-format support** — OTel, pino, winston, bunyan, and generic JSON (priority chain: OTel > bunyan > pino > winston > generic)
- **Level-based coloring** — ERROR=red, WARN=yellow, INFO=cyan, DEBUG/TRACE=gray, FATAL=bold red
- **Resource block suppression** — repeated `service.name`, `hostname`, etc. blocks shown once, not on every line
- **Alt screen bypass** — vim, less, top, SSH pass through unmodified
- **Level filtering** — Show Only ERROR, Show Only WARN+, Show All
- **Toggle on/off** — flip beautification without closing the terminal
- **Set as default** — every new terminal beautifies logs automatically

## Usage

### Option 1: Every new terminal beautifies logs (recommended)

1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run **OTel: Set as Default Terminal**
3. Open any new terminal (`Ctrl+\``) — JSON logs are automatically formatted

To revert: Command Palette → **OTel: Restore Default Terminal**.

### Option 2: One-off beautified terminal

1. Open Command Palette
2. Run **OTel: Open Beautified Terminal**
3. Run your service — JSON log lines are automatically formatted

## Commands

| Command | Description |
|---|---|
| OTel: Open Beautified Terminal | Opens a new terminal with log beautification |
| OTel: Toggle Beautify | Flip formatting on/off |
| OTel: Show Only ERROR | Filter to ERROR level only |
| OTel: Show Only WARN+ | Filter to WARN, ERROR, FATAL |
| OTel: Show All Levels | Remove level filter |
| OTel: Set as Default Terminal | Make beautified terminal the default profile |
| OTel: Restore Default Terminal | Revert to standard shell |

## Supported log formats

| Format | Detected by | Timestamp | Level | Message |
|---|---|---|---|---|
| **OTel** | `severity_text` / `severity_number` | `timestamp` | `severity_text` | `body` / `message` |
| **Bunyan** | `hostname` + `name` + numeric `level` | `time` | numeric `level` | `msg` |
| **Pino** | numeric `level` + `pid` | `time` (epoch ms) | numeric `level` | `msg` |
| **Winston** | string `level` + `message` | `timestamp` | string `level` | `message` |
| **Generic** | fallback | `timestamp` / `time` / `ts` / `@timestamp` | `level` / `lvl` / `severity` | `message` / `msg` / `text` |

## Links

- **Source:** https://github.com/Trimud/otel-log-beautifier
- **Issues:** https://github.com/Trimud/otel-log-beautifier/issues
- **Changelog:** https://github.com/Trimud/otel-log-beautifier/releases

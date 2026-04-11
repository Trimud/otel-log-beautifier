# TODOS

## P2

### Worker thread for parse/format pipeline
Move LineBuffer/JsonDetector/LogNormalizer/LogFormatter to a Node.js Worker thread to prevent blocking the VS Code extension host at sustained high throughput (50K+ lines/sec). Main thread handles PTY I/O and onDidWrite; worker handles CPU-intensive parsing.

- **Why:** At 10K lines/sec, single-threaded uses ~50ms/sec CPU (acceptable). But at 50K+ lines/sec, extension host lag becomes visible. Worker thread isolates the parse cost.
- **Pros:** Better VS Code responsiveness under extreme load.
- **Cons:** Adds serialization overhead for every chunk crossing the thread boundary, message channel protocol, error propagation complexity, and lifecycle management.
- **Blocked by:** Profiling data showing actual extension host lag. Don't add until measured.
- **Depends on:** Phase 2 (parser pipeline) complete.
- **Effort:** M (human: ~3 hr / CC: ~20 min)

## P3

### Copy formatted log as markdown
Right-click context menu on beautified log line -> "Copy as Markdown". Produces a formatted code block for pasting into GitHub issues, Slack, or docs.

- **Why:** Saves manual formatting when sharing log snippets in bug reports.
- **Pros:** Quality-of-life for sharing.
- **Cons:** Terminal context menu API has limitations. May not work perfectly for multi-line selections.
- **Depends on:** Phase 4 (config/commands) complete.
- **Effort:** S (human: ~30 min / CC: ~5 min)

### Auto-detect JSON output and offer beautified terminal
When VS Code's built-in terminal detects JSON output (via Terminal Data event listener), show a notification: "Detected JSON log output. Open a Beautified Terminal?" with a button.

- **Why:** Bridges the discoverability gap between "explicit command only" and "auto-activate for all terminals." User gets prompted naturally when they'd benefit.
- **Pros:** Natural discovery at the moment of need.
- **Cons:** Medium effort, false positive risk (non-log JSON output triggers it), notification could be annoying.
- **Depends on:** Full extension working (all 5 phases complete).
- **Effort:** M (human: ~2 hr / CC: ~15 min)

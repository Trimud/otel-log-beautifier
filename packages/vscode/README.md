# OTel Log Beautifier

Beautifies OpenTelemetry JSON structured logs in the VS Code integrated terminal.

## Features

- Automatic JSON log detection and formatting with ANSI colors
- Supports OTel, pino, winston, bunyan, and generic JSON formats
- Level-based coloring (ERROR=red, WARN=yellow, INFO=cyan, DEBUG=gray)
- Repeated resource block suppression
- Alt screen buffer detection (vim, less, top pass through unchanged)
- Log level filtering (ERROR only, WARN+, all)
- Toggle beautification on/off

## Usage

1. Open Command Palette (`Cmd+Shift+P`)
2. Run **OTel: Open Beautified Terminal**
3. Run your service — JSON log lines are automatically formatted

## Commands

| Command | Description |
|---------|-------------|
| OTel: Open Beautified Terminal | Opens a new terminal with log beautification |
| OTel: Toggle Beautify | Toggle formatting on/off |
| OTel: Show Only ERROR | Filter to ERROR level only |
| OTel: Show Only WARN+ | Filter to WARN and above |
| OTel: Show All Levels | Remove level filter |

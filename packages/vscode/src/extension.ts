import * as vscode from 'vscode';
import { BeautifiedTerminal } from './terminal/beautifiedTerminal.js';

const activeTerminals = new Set<BeautifiedTerminal>();

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('otelLogBeautifier.openTerminal', () => {
      const pty = new BeautifiedTerminal();
      activeTerminals.add(pty);
      const terminal = vscode.window.createTerminal({ name: 'OTel Beautified', pty });
      terminal.show();
    }),

    vscode.commands.registerCommand('otelLogBeautifier.toggleBeautify', () => {
      const terminal = vscode.window.activeTerminal;
      if (!terminal) return;
      for (const pty of activeTerminals) {
        pty.toggleBeautify();
      }
    }),

    vscode.commands.registerCommand('otelLogBeautifier.filterError', () => {
      for (const pty of activeTerminals) {
        pty.setLevelFilter('ERROR');
      }
    }),

    vscode.commands.registerCommand('otelLogBeautifier.filterWarn', () => {
      for (const pty of activeTerminals) {
        pty.setLevelFilter('WARN');
      }
    }),

    vscode.commands.registerCommand('otelLogBeautifier.filterAll', () => {
      for (const pty of activeTerminals) {
        pty.setLevelFilter(null);
      }
    }),
  );
}

export function deactivate(): void {
  for (const pty of activeTerminals) {
    pty.close();
  }
  activeTerminals.clear();
}

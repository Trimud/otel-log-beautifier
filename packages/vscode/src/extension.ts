import * as vscode from 'vscode';
import { BeautifiedTerminal } from './terminal/beautifiedTerminal.js';
import { OtelTerminalProfileProvider } from './terminal/terminalProfileProvider.js';

const activeTerminals = new Set<BeautifiedTerminal>();

export function activate(context: vscode.ExtensionContext): void {
  // Register terminal profile so it appears in the terminal dropdown
  context.subscriptions.push(
    vscode.window.registerTerminalProfileProvider(
      'otelLogBeautifier.terminalProfile',
      new OtelTerminalProfileProvider(),
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('otelLogBeautifier.openTerminal', () => {
      const pty = new BeautifiedTerminal({ cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath });
      activeTerminals.add(pty);
      const terminal = vscode.window.createTerminal({ name: 'OTel Beautified', pty });
      terminal.show();
    }),

    vscode.commands.registerCommand('otelLogBeautifier.toggleBeautify', () => {
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

    vscode.commands.registerCommand('otelLogBeautifier.setAsDefault', async () => {
      const platform = process.platform === 'darwin' ? 'osx'
        : process.platform === 'win32' ? 'windows'
        : 'linux';
      const settingKey = `terminal.integrated.defaultProfile.${platform}`;

      await vscode.workspace.getConfiguration().update(
        settingKey,
        'OTel Beautified',
        vscode.ConfigurationTarget.Global,
      );
      vscode.window.showInformationMessage(
        'OTel Beautified is now your default terminal. All new terminals will beautify JSON logs.',
      );
    }),

    vscode.commands.registerCommand('otelLogBeautifier.removeDefault', async () => {
      const platform = process.platform === 'darwin' ? 'osx'
        : process.platform === 'win32' ? 'windows'
        : 'linux';
      const settingKey = `terminal.integrated.defaultProfile.${platform}`;

      await vscode.workspace.getConfiguration().update(
        settingKey,
        undefined,
        vscode.ConfigurationTarget.Global,
      );
      vscode.window.showInformationMessage(
        'Default terminal restored. New terminals will use the standard shell.',
      );
    }),
  );
}

export function deactivate(): void {
  for (const pty of activeTerminals) {
    pty.close();
  }
  activeTerminals.clear();
}

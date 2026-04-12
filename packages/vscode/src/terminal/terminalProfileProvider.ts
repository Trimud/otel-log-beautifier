import * as vscode from 'vscode';
import { BeautifiedTerminal } from './beautifiedTerminal.js';

export class OtelTerminalProfileProvider implements vscode.TerminalProfileProvider {
  provideTerminalProfile(
    _token: vscode.CancellationToken,
  ): vscode.ProviderResult<vscode.TerminalProfile> {
    return new vscode.TerminalProfile({
      name: 'OTel Beautified',
      pty: new BeautifiedTerminal(),
    });
  }
}

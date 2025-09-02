import * as vscode from 'vscode';
import { SelectJsonCommand, NavigateCommand } from './commands';

export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand('keypath.selectJson', () => SelectJsonCommand(context)),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('keypath.navigate', () => NavigateCommand(context)),
    );

    // create a status bar button that calls navigate at cursor
    const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBar.text = '$(search) Keypath';
    statusBar.tooltip = 'Navigate JSON path at cursor (Keypath: Navigate to Path)';
    statusBar.command = 'keypath.navigate';
    statusBar.show();
    context.subscriptions.push(statusBar);

    // DefinitionProvider removed to avoid Ctrl+hover triggering navigation. Use the status bar button or commands instead.

    // Terminal link provider and terminal integration removed per user request.
}

export function deactivate() {}

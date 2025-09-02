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

    // register terminal link provider so paths printed in the integrated terminal become clickable
    // use dynamic access to avoid TypeScript errors when building against older vscode typings
    if ((vscode.window as any).registerTerminalLinkProvider) {
        context.subscriptions.push((vscode.window as any).registerTerminalLinkProvider(new KeypathTerminalLinkProvider(context)));
    }
}

export function deactivate() {}

class KeypathTerminalLinkProvider {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    provideTerminalLinks(contextArg: any, token: any): any {
        const line = contextArg.line as string;
        const regex = /['"`]?[_A-Za-z0-9$\[\]\.\-]+['"`]?/g;
        const links: any[] = [];
        let m: RegExpExecArray | null;
        while ((m = regex.exec(line)) !== null) {
            const raw = m[0];
            const trimmed = raw.replace(/^['"`]|['"`]$/g, '');
            links.push({ startIndex: m.index, length: raw.length, tooltip: 'Open path in selected JSON', data: trimmed });
        }
        return links;
    }

    async handleTerminalLink(link: any): Promise<void> {
        const path = link.data as string;
        try {
            const nav = await import('./jsonNavigator');
            const found = await nav.findPathInWorkspace(path);
            if (found) {
                const doc = await vscode.workspace.openTextDocument(found.uri);
                const start = doc.positionAt(found.start);
                const end = doc.positionAt(found.end);
                const e = await vscode.window.showTextDocument(doc);
                e.revealRange(new vscode.Range(start, end), vscode.TextEditorRevealType.InCenter);
                e.selection = new vscode.Selection(start, end);
                return;
            }

            // fallback to previously selected single file if workspace search failed
            const selected = this.context.workspaceState.get<string>('keypath:selectedJson');
            if (selected) {
                const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(selected));
                const text = doc.getText();
                const off = nav.findOffsetForPath(text, path);
                if (off) {
                    const start = doc.positionAt(off.start);
                    const end = doc.positionAt(off.end);
                    const e = await vscode.window.showTextDocument(doc);
                    e.revealRange(new vscode.Range(start, end), vscode.TextEditorRevealType.InCenter);
                    e.selection = new vscode.Selection(start, end);
                    return;
                }
            }

            vscode.window.showInformationMessage(`Path not found in workspace: ${path}`);
        } catch (e) {
            vscode.window.showErrorMessage(String(e));
        }
    }
}

import * as vscode from 'vscode';

export async function SelectJsonCommand(context: vscode.ExtensionContext) {
    const uris = await vscode.window.showOpenDialog({ canSelectMany: false, filters: { 'JSON': ['json'] } });
    if (!uris || uris.length === 0) return;
    const selected = uris[0].fsPath;
    await context.workspaceState.update('keypath:selectedJson', selected);
    vscode.window.showInformationMessage(`Selected JSON: ${selected}`);
}

export async function NavigateCommand(context: vscode.ExtensionContext) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const doc = editor.document;
    const sel = editor.selection;
    const range = doc.getWordRangeAtPosition(sel.active, /[A-Za-z0-9_.\-]+/);
    if (!range) return;
    const word = doc.getText(range);
    // allow tokens that are prefixes with trailing dots (e.g. "entity.general.time.")
    // normalize by stripping trailing dots so the lookup will search for `entity.general.time`
    const path = word.replace(/\.+$/, '');

    // try workspace-wide search under configured glob and open ALL matches (subject to maxOpenResults)
    try {
        const nav = await import('./jsonNavigator');
        const all = await nav.findAllPathsInWorkspace(path);
        if (all && all.length > 0) {
            const config = vscode.workspace.getConfiguration('keypath');
            const max = (config && typeof config.get === 'function') ? (config.get<number>('maxOpenResults') ?? 10) : 10;
            const limit = (max === 0) ? all.length : Math.min(all.length, Math.max(0, max));
            for (let i = 0; i < limit; i++) {
                const found = all[i];
                try {
                    const doc2 = await vscode.workspace.openTextDocument(found.uri);
                    // open the first result focused, others opened but preserve focus
                    const e = await vscode.window.showTextDocument(doc2, { preview: false, preserveFocus: i > 0 });
                    const start = doc2.positionAt(found.start);
                    const end = doc2.positionAt(found.end);
                    e.revealRange(new vscode.Range(start, end), vscode.TextEditorRevealType.InCenter);
                    e.selection = new vscode.Selection(start, end);
                } catch (err) {
                    // ignore individual file open errors
                    continue;
                }
            }
            return;
        }

        // fallback: if user still has an explicitly selected JSON file, try that
        const selected = context.workspaceState.get<string>('keypath:selectedJson');
        if (selected) {
            const targetDoc = await vscode.workspace.openTextDocument(vscode.Uri.file(selected));
            const text = targetDoc.getText();
            const off = nav.findOffsetForPath(text, path);
            if (off) {
                const start = targetDoc.positionAt(off.start);
                const end = targetDoc.positionAt(off.end);
                const e = await vscode.window.showTextDocument(targetDoc);
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

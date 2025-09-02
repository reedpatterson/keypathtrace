import * as vscode from 'vscode';

export function findOffsetForPath(text: string, path: string): {start: number, end: number} | null {
    try {
        const data = JSON.parse(text);
        const parts = path.split('.');
        let node: any = data;
        for (const p of parts) {
            if (node && typeof node === 'object' && p in node) {
                node = node[p];
            } else return null;
        }
        // now search for the textual position of the final node by key
        const key = parts[parts.length-1];
        const re = new RegExp(`"${key}"\s*:\s*`, 'g');
        let match: RegExpExecArray | null;
        while ((match = re.exec(text)) !== null) {
            const idx = match.index;
            // quick heuristic: ensure this occurrence is within braces that correspond to the parent object
            return { start: idx, end: idx + match[0].length };
        }
    } catch (e) {
        return null;
    }
    return null;
}

export async function findAllPathsInWorkspace(path: string): Promise<Array<{uri: vscode.Uri, start: number, end: number}>> {
    const results: Array<{uri: vscode.Uri, start: number, end: number}> = [];
    try {
        const config = vscode.workspace.getConfiguration('keypath');
        const glob = (config && typeof config.get === 'function') ? (config.get<string>('fileGlob') || 'src/**/*.json') : 'src/**/*.json';
        const files = await vscode.workspace.findFiles(glob);
        for (const f of files) {
            try {
                const doc = await vscode.workspace.openTextDocument(f);
                const text = doc.getText();
                const off = findOffsetForPath(text, path);
                if (off) {
                    results.push({ uri: f, start: off.start, end: off.end });
                }
            } catch (e) {
                // ignore files that fail to parse/open
                continue;
            }
        }
    } catch (e) {
        return results;
    }
    return results;
}

// keep compatibility: return first match or null
export async function findPathInWorkspace(path: string): Promise<{uri: vscode.Uri, start: number, end: number} | null> {
    const all = await findAllPathsInWorkspace(path);
    return all.length > 0 ? all[0] : null;
}

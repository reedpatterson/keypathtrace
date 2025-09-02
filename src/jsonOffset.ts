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
        const key = parts[parts.length - 1];
        const re = new RegExp(`"${key}"\\s*:\\s*`, 'g');
        let match: RegExpExecArray | null;
        while ((match = re.exec(text)) !== null) {
            const idx = match.index;
            return { start: idx, end: idx + match[0].length };
        }
    } catch (e) {
        return null;
    }
    return null;
}

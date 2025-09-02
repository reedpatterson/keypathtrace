# Keypath Navigator (KeypathTrace)

A small Visual Studio Code extension that locates and opens JSON values by dot-separated key paths (for example `path7.test2`). It searches JSON files across the workspace (default: `src/**/*.json`) and opens any files that contain the requested key path.

This repository contains the extension source in `src/` and the activation/debug configuration used during development.

## Features

- Search workspace JSON files for a dot-separated key path and open all matching files. Matches are opened with preview disabled (tabs are persistent).
- Trigger navigation from the editor at the cursor via a command or a single-click status bar button.
- Handles quoted and unquoted dot-path tokens. Complex array indexing and escaped/quoted-key edge cases are lower-priority and may be improved later.

## Quick usage

1. Place the text cursor on a dot-separated JSON key path in any editor (for example: `user.profile.name`, `app.title`, or a quoted key like `"some.key"`).
2. Click the `Keypath` status bar button (single click) or run the command `Keypath: Navigate` from the Command Palette.
3. All workspace JSON files that contain the key path will be opened. If no workspace match is found, the extension falls back to manually selecting a JSON file (legacy behavior).

Example paths:
- Unquoted: `settings.theme.color`
- Quoted (basic): `"menu.item with space".label`

## Commands

- `keypath.navigate` — Main command: navigate to a key path at the active editor cursor or prompt for input when no editor is available.
- `keypath.selectJson` — Legacy command: pick a single JSON file and navigate a path inside it.

Use the Command Palette (Ctrl+Shift+P / Cmd+Shift+P) to run these commands.

Note: Terminal link integration has been removed. Use the status bar button or the `Keypath: Navigate` command from an editor to trigger navigation.

## Default behavior and implementation notes

- Default JSON file glob: `src/**/*.json` (this is currently configurable via `keypath.fileGlob` — see Configuration below). The extension scans matching files in the workspace to find the requested path.
- When a path exists in multiple files (for example `en.json` and `es.json`), all matching files are opened (subject to `keypath.maxOpenResults`).
- The navigator uses a JSON parse to verify the path exists, then a text-based heuristic to find an offset to reveal in the editor. This generally works but is not AST-perfect for every edge case.

## Configuration

The extension exposes two user settings under `keypath`:

- `keypath.fileGlob` (string, default: `src/**/*.json`)
  - A glob pattern used to find JSON files in the workspace. Change this to match your repository layout (for example `**/*.json` or `i18n/**/*.json`).

- `keypath.maxOpenResults` (number, default: `10`, 0 = no limit)
  - Maximum number of matching files to open when navigating a key path. When many files match a key path you may prefer to limit the number of tabs opened; set to `0` to disable the limit.

To change settings, open Settings (Ctrl+,) and search for "Keypath" or add entries to your workspace `settings.json`:

```json
{
  "keypath.fileGlob": "i18n/**/*.json",
  "keypath.maxOpenResults": 20
}
```

## Limitations

- Current matching uses a regex/text heuristic to compute offsets. This can be inaccurate for complex quoted/escaped keys, arrays, or when precise AST offsets are required.
- Very large repositories may be slow to scan; consider tightening `keypath.fileGlob` or implementing indexing.
- The default `keypath.maxOpenResults` prevents opening too many tabs; adjust to your preference.

## Roadmap / Improvements you might enable

- Replace the textual offset heuristic with an AST-based solution (for example using `jsonc-parser`) to return exact node offsets and better handle arrays/quoted keys.
- Build a workspace index or incremental caching for fast lookups in large projects.
- Add a DocumentLinkProvider for clickable links inside editors (non-intrusive click-only behavior) as an alternative to the previously removed DefinitionProvider.

## Development

Project structure (important files):

- `src/extension.ts` — activation and status bar button registration (terminal integration removed).
- `src/commands.ts` — `NavigateCommand` and `SelectJsonCommand` implementations.
- `src/jsonNavigator.ts` — workspace scanning and path-to-offset helpers.
- `src/jsonOffset.ts` — pure utility used to compute textual offsets for a key path (unit-testable).
- `package.json` — extension metadata, activation events, contributed commands and configuration.
- `tsconfig.json` and `.vscode/launch.json` — compiler and debug configuration.

To run and debug locally:

1. Install dependencies: `npm install`
2. Compile (if needed): `npm run compile` (or rely on the VS Code TypeScript build task)
3. Press F5 in VS Code to launch an Extension Development Host using the provided `.vscode/launch.json`.

## Contributing

Contributions, issues and feature requests are welcome. Suggested starter improvements:
- Add configuration settings for file glob and max results.
- Improve offset accuracy using `jsonc-parser` to find exact node ranges.
- Add unit/integration tests and CI for linting/packaging.

## License

MIT — feel free to reuse or modify the code.

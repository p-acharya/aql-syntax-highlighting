# AQL Syntax Highlighting

ANNIS Query Language (AQL) syntax highlighting for Obsidian code blocks.

## Features

- Registers an AQL CodeMirror mode for fenced code blocks.
- Supports token highlighting for strings, operators, metadata, node references, and node classes.
- Includes optional CSS snippet support for ANNIS-style node colors.

## Usage

Use fenced code blocks with the language tag `aql`:

```markdown
```aql
cat="PP" & cat="NP" & #1 > #2
```
```

Another example:

```markdown
```aql
tok="learning" & pos="NN" & #1 . #2
```
```

## Development

Requirements:

- Node.js 16+
- npm

Install and build:

```bash
npm ci
npm run build
```

Watch mode during development:

```bash
npm run dev
```

## Optional CSS Snippet

Use the snippet file at:

- `.obsidian/snippets/aql-highlighting.css`

Enable it in Obsidian:

- Settings -> Appearance -> CSS snippets

## Release Checklist

1. Update `manifest.json` version.
2. Update `versions.json` with the new version to minAppVersion mapping.
3. Build with `npm run build`.
4. Create a GitHub release tagged with the same version as `manifest.json`.
5. Upload release assets:
   - `manifest.json`
   - `main.js`
   - `styles.css` (only if used by the plugin)

## License

MIT. See `LICENSE`.

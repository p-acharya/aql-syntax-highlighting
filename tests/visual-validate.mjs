#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const stylesPath = path.join(repoRoot, "styles.css");
const outDir = path.join(repoRoot, "tests", "artifacts");

const baseCss = `
:root {
  color-scheme: dark;
}

body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #11161f;
  color: #d7dfef;
  font-family: ui-monospace, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.preview {
  width: min(900px, 92vw);
  background: linear-gradient(180deg, #212736 0%, #171c27 100%);
  border: 1px solid #2f3a52;
  border-radius: 12px;
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.title {
  margin: 0;
  padding: 14px 16px;
  font-size: 14px;
  color: #9fb0cc;
  background: #2a3347;
  border-bottom: 1px solid #394664;
}

.code {
  margin: 0;
  padding: 16px;
  line-height: 1.75;
  font-size: 24px;
  white-space: pre;
}

.cm-s-obsidian {
  color: #e6eaf2;
}
`;

const overrideCss = `
.cm-s-obsidian .cm-string,
.cm-s-obsidian .cm-string-2 {
  color: #2aa198 !important;
  font-style: italic;
}

.cm-s-obsidian .cm-operator {
  color: #dc322f !important;
  font-weight: 700;
}

.cm-s-obsidian .cm-node_1 {
  color: #268bd2 !important;
  font-weight: 700;
}
`;

function renderHtml(title, includeOverride) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="stylesheet" href="./base.css" />
  <link rel="stylesheet" href="${pathToFileURL(stylesPath).href}" />
  ${includeOverride ? '<link rel="stylesheet" href="./override.css" />' : ""}
</head>
<body>
  <section class="preview">
    <h2 class="title">${title}</h2>
    <pre class="code cm-s-obsidian"><span class="cm-meta">\`\`\`aql</span>
<span class="cm-def">cat</span><span class="cm-operator">=</span><span class="cm-string">\"PP\"</span> <span class="cm-operator">&amp;</span> <span class="cm-def">cat</span><span class="cm-operator">=</span><span class="cm-string">\"NP\"</span> <span class="cm-operator">&amp;</span> <span class="cm-variable-2 cm-node_1">#1</span> <span class="cm-operator">&gt;</span> <span class="cm-variable-2 cm-node_2">#2</span>
<span class="cm-property">meta::author</span><span class="cm-operator">=</span><span class="cm-string-2">\"Chomsky\"</span>
<span class="cm-meta">\`\`\`</span></pre>
  </section>
</body>
</html>`;
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
    return null;
  }
}

async function main() {
  const playwright = await loadPlaywright();
  if (!playwright) {
    console.error("Playwright is not installed.");
    console.error("Run: npm install --save-dev playwright");
    process.exit(1);
  }

  await fs.mkdir(outDir, { recursive: true });

  const tempDir = await fs.mkdtemp(path.join(outDir, "tmp-"));

  try {
    const beforeHtmlPath = path.join(tempDir, "before.html");
    const afterHtmlPath = path.join(tempDir, "after.html");

    await fs.writeFile(path.join(tempDir, "base.css"), baseCss, "utf8");
    await fs.writeFile(path.join(tempDir, "override.css"), overrideCss, "utf8");
    await fs.writeFile(beforeHtmlPath, renderHtml("Before: default plugin styles.css", false), "utf8");
    await fs.writeFile(afterHtmlPath, renderHtml("After: custom snippet overrides enabled", true), "utf8");

    const browser = await playwright.chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 760 } });

    const beforeUrl = pathToFileURL(beforeHtmlPath).href;
    const afterUrl = pathToFileURL(afterHtmlPath).href;

    await page.goto(beforeUrl);
    await page.screenshot({ path: path.join(outDir, "validation-before.png"), fullPage: true });

    await page.goto(afterUrl);
    await page.screenshot({ path: path.join(outDir, "validation-after.png"), fullPage: true });

    await browser.close();

    const [beforePng, afterPng] = await Promise.all([
      fs.readFile(path.join(outDir, "validation-before.png")),
      fs.readFile(path.join(outDir, "validation-after.png")),
    ]);

    const beforeHash = sha256(beforePng);
    const afterHash = sha256(afterPng);

    if (beforeHash === afterHash) {
      console.error("Validation failed: before/after screenshots are identical.");
      process.exit(1);
    }

    console.log("Validation screenshots generated:");
    console.log(path.join("tests", "artifacts", "validation-before.png"));
    console.log(path.join("tests", "artifacts", "validation-after.png"));
    console.log("Validation passed: screenshots differ as expected.");
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const failures = [];
const notes = [];

const read = (relativePath) => fs.readFile(path.join(root, relativePath), 'utf8');
const cssFiles = [
  'styles.css',
  'tokens/primitives.css',
  'tokens/themes.css',
  'tokens/typography.css',
  'tokens/spacing.css',
  'tokens/motion.css',
  'tokens/base.css',
  'components/components.css',
];

const requiredFiles = [
  'README.md',
  'MIGRATION.md',
  'SOURCE_AUDIT.md',
  '_ds_manifest.json',
  'index.html',
  'preview.js',
  ...cssFiles,
  'tokens/tokens.json',
  'patterns/product-patterns.md',
  'patterns/responsive.md',
  'patterns/states.md',
];

for (const relativePath of requiredFiles) {
  try {
    await fs.access(path.join(root, relativePath));
  } catch {
    failures.push(`Missing required file: ${relativePath}`);
  }
}

const [indexHtml, previewJs, tokenJsonText, manifestText, ...cssTexts] = await Promise.all([
  read('index.html'),
  read('preview.js'),
  read('tokens/tokens.json'),
  read('_ds_manifest.json'),
  ...cssFiles.map(read),
]);

let tokenJson;
let manifest;
for (const [name, text, setter] of [
  ['tokens/tokens.json', tokenJsonText, (value) => { tokenJson = value; }],
  ['_ds_manifest.json', manifestText, (value) => { manifest = value; }],
]) {
  try {
    setter(JSON.parse(text));
  } catch (error) {
    failures.push(`${name} is not valid JSON: ${error.message}`);
  }
}

if (tokenJson?.version !== '0.2.0') failures.push('tokens/tokens.json version must be 0.2.0');
if (manifest?.version !== '0.2.0') failures.push('_ds_manifest.json version must be 0.2.0');
if (JSON.stringify(manifest?.themes) !== JSON.stringify(['dark', 'light'])) {
  failures.push('_ds_manifest.json must declare dark and light themes in that order');
}

const importPattern = /@import\s+url\(['"](.+?)['"]\)/g;
for (const [file, text] of cssFiles.map((file, index) => [file, cssTexts[index]])) {
  for (const match of text.matchAll(importPattern)) {
    const target = path.resolve(root, path.dirname(file), match[1]);
    try {
      await fs.access(target);
    } catch {
      failures.push(`${file} imports missing file ${match[1]}`);
    }
  }
  const opens = (text.match(/{/g) || []).length;
  const closes = (text.match(/}/g) || []).length;
  if (opens !== closes) failures.push(`${file} has unbalanced braces (${opens} open, ${closes} close)`);
}

for (const source of indexHtml.matchAll(/(?:href|src)=["'](\.\/.+?)["']/g)) {
  const target = path.resolve(root, source[1]);
  try {
    await fs.access(target);
  } catch {
    failures.push(`index.html references missing file ${source[1]}`);
  }
}

const allStyleText = `${cssTexts.join('\n')}\n${indexHtml}`;
const definitions = new Set(
  [...allStyleText.matchAll(/(--[a-z0-9-]+)\s*:/gi)].map((match) => match[1]),
);
const uses = [...allStyleText.matchAll(/var\(\s*(--[a-z0-9-]+)(\s*,[^)]*)?\)/gi)];
for (const match of uses) {
  const [, token, fallback] = match;
  if (!definitions.has(token) && !fallback) {
    failures.push(`Undefined CSS custom property without fallback: ${token}`);
  }
}

const ids = [...indexHtml.matchAll(/\sid=["']([^"']+)["']/g)].map((match) => match[1]);
for (const id of new Set(ids)) {
  if (ids.filter((candidate) => candidate === id).length > 1) {
    failures.push(`Duplicate HTML id: ${id}`);
  }
}

const codeSurface = [indexHtml, previewJs, ...cssTexts].join('\n');
for (const forbidden of [
  /\bLumix\b/i,
  /prediction market/i,
  /\bYES\b/,
  /\bNO\b/,
  /\bbet(?:s|ting)?\b/i,
  /\bodds\b/i,
  /\bleaderboard\b/i,
  /market resolution/i,
]) {
  if (forbidden.test(codeSurface)) {
    failures.push(`Retired source-product term remains in the coded specimen: ${forbidden}`);
  }
}

for (const requiredTerm of ['Spot', 'Options', 'RFQ', 'Perpetuals', 'Vault', 'Blend', 'Portfolio', 'Activity']) {
  if (!indexHtml.includes(requiredTerm)) failures.push(`HTML specimen is missing product area: ${requiredTerm}`);
}

for (const requiredSection of ['foundations', 'buttons', 'inputs', 'cards', 'trading', 'tables', 'charts', 'navigation', 'states']) {
  if (!indexHtml.includes(`id="${requiredSection}"`)) failures.push(`HTML specimen is missing section: ${requiredSection}`);
}

if (!/:root\[data-theme=['"]light['"]\]/.test(codeSurface)) {
  failures.push('The semantic token layer must include a light theme');
}

const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  return [0, 2, 4].map((start) => Number.parseInt(value.slice(start, start + 2), 16) / 255);
};
const luminance = (hex) => {
  const channels = hexToRgb(hex).map((value) => (
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  ));
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};
const contrast = (foreground, background) => {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

const contrastPairs = [
  ['primary on canvas', '#F4F4F5', '#0A0A0B', 4.5],
  ['primary on surface', '#F4F4F5', '#141416', 4.5],
  ['secondary on surface', '#A1A1A6', '#141416', 4.5],
  ['muted AA alias on raised', '#85858B', '#1C1C1F', 4.5],
  ['accent text on surface', '#8FA6FF', '#141416', 4.5],
  ['positive on positive tint', '#35C46A', '#10241A', 4.5],
  ['negative on negative tint', '#F0524B', '#241214', 4.5],
  ['warning on surface', '#FFBA00', '#141416', 4.5],
  ['white on primary accent', '#FFFFFF', '#2E5CFF', 4.5],
  ['inverse on positive action', '#0A0A0B', '#35C46A', 4.5],
  ['inverse on negative action', '#0A0A0B', '#F0524B', 4.5],
  ['light primary on canvas', '#17171A', '#F6F6F8', 4.5],
  ['light secondary on surface', '#4F4F59', '#FFFFFF', 4.5],
  ['light muted on raised', '#696974', '#EEEEF2', 4.5],
  ['light accent text on surface', '#244DE0', '#FFFFFF', 4.5],
  ['light positive on surface', '#167441', '#FFFFFF', 4.5],
  ['light negative on surface', '#A93430', '#FFFFFF', 4.5],
  ['light warning on surface', '#9A6500', '#FFFFFF', 4.5],
  ['white on light-theme accent', '#FFFFFF', '#244DE0', 4.5],
];

for (const [label, foreground, background, minimum] of contrastPairs) {
  const ratio = contrast(foreground, background);
  notes.push(`${label}: ${ratio.toFixed(2)}:1`);
  if (ratio < minimum) failures.push(`${label} contrast is ${ratio.toFixed(2)}:1; expected at least ${minimum}:1`);
}

notes.push(`legacy muted primitive on surface: ${contrast('#6E6E73', '#141416').toFixed(2)}:1 (reference/disabled only)`);

if (failures.length) {
  console.error('Design-system validation failed:\n');
  failures.forEach((failure) => console.error(`- ${failure}`));
  console.error('\nContrast report:');
  notes.forEach((note) => console.error(`- ${note}`));
  process.exit(1);
}

console.log('Design-system validation passed.');
console.log(`Checked ${requiredFiles.length} required files, ${cssFiles.length} CSS files, 2 JSON files, JavaScript, and the HTML specimen.`);
console.log('Contrast report:');
notes.forEach((note) => console.log(`- ${note}`));

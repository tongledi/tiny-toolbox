/** Validate registered routes and provide directory URLs for any plain static host. */
import { copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { tools } from '../lib/tools.ts';
const root = resolve('dist/client');
const home = readFileSync(resolve(root, 'index.html'), 'utf8');
if (!home.includes('随手工具箱')) throw new Error('Missing rendered home page');
for (const tool of tools) {
  const route = tool.href.replace(/^\/+|\/+$/g, '');
  if (!/^tools\/[a-z0-9-]+$/.test(route))
    throw new Error(`Unsupported static tool URL: ${tool.href}`);
  const directoryEntry = resolve(root, route, 'index.html');
  const source = resolve(root, `${route}.html`);
  if (existsSync(source)) {
    mkdirSync(dirname(directoryEntry), { recursive: true });
    copyFileSync(source, directoryEntry);
  }
  if (!existsSync(directoryEntry))
    throw new Error(`Export omitted ${tool.href}`);
  const html = readFileSync(directoryEntry, 'utf8');
  if (!html.includes(tool.name))
    throw new Error(`Invalid rendered tool: ${tool.name}`);
  console.log(`Verified static tool: ${tool.href}`);
}

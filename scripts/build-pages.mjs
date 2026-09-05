import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const prefix = '/tiny-toolbox';
const run = spawnSync('npm', ['run', 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NEXT_PUBLIC_SITE_BASE_PATH: prefix,
    TOOLBOX_ASSET_PREFIX: `https://tongledi.github.io${prefix}`,
  },
});
if (run.status !== 0) process.exit(run.status || 1);
const output = resolve('outputs/github-pages');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
cpSync(resolve('dist/client'), output, { recursive: true });
writeFileSync(resolve(output, '.nojekyll'), '');
console.log(`Pages files: ${output}`);

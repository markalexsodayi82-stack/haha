import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const required = [
  'index.html','package.json','vite.config.js','src/main.jsx','src/App.jsx',
  'src/components/ui.jsx','src/services/core-data.js','src/styles.css',
  'server/server.js','server/start.js','scripts/dev-start.js'
];
const pages = ['Dashboard','Shop','Orders','Billing','Gallons','Favorites','Subscriptions','Profile','Delivery','Payments','Inventory','Products','Customers','Riders','Reports','Promotions','ActivityLogs','Backend'];

let failed = false;
for (const file of required) {
  try { await access(join(root, file)); } catch { console.error(`[VERIFY FAIL] Missing ${file}`); failed = true; }
}



const checks = ['server/server.js','server/start.js','server/stop.js','scripts/dev-start.js','scripts/verify.js'];
for (const file of checks) {
  const result = spawnSync(process.execPath, ['--check', join(root,file)], { encoding:'utf8' });
  if (result.status !== 0) { console.error(`[VERIFY FAIL] ${file}\n${result.stderr || result.stdout}`); failed = true; }
}

const app = await readFile(join(root,'src/App.jsx'),'utf8');
const requiredRoutes = ['dashboard','shop','orders','track','billing','gallons','favorites','subscription','profile','delivery','payments','inventory','products','customers','riders','reports','promotions','activity','backend'];
for (const route of requiredRoutes) if (!app.includes(`${route}:`)) { console.error(`[VERIFY FAIL] Missing route: ${route}`); failed = true; }

if (failed) process.exit(1);
console.log('[VERIFY OK] AquaFlow navigation routes, required files, and server-side JavaScript syntax are valid.');

import { spawn } from 'node:child_process';
import process from 'node:process';
import { DEFAULT_PORT, findAvailablePort, findRunningAquaFlowPort, savePort } from '../server/port-utils.js';

const VITE_PORT = Number(process.env.VITE_PORT || 5173);
const runningBackend = await findRunningAquaFlowPort(DEFAULT_PORT, DEFAULT_PORT + 20);
const backendPort = runningBackend || await findAvailablePort(DEFAULT_PORT, DEFAULT_PORT + 20);
await savePort(backendPort);

const children = [];
let shuttingDown = false;

if (!runningBackend) {
  const backend = spawn(process.execPath, ['server/server.js'], {
    stdio: 'inherit', shell: false, env: { ...process.env, PORT: String(backendPort) }
  });
  children.push(backend);
  backend.on('error', e => { console.error(`[BACKEND FAILED] ${e.message}`); cleanup(1); });
  backend.on('exit', (code, signal) => {
    if (!shuttingDown && code && code !== 0) console.error(`[BACKEND STOPPED] code=${code} signal=${signal || 'none'}`);
  });
} else {
  console.log(`[DEV] AquaFlow backend already running on port ${backendPort}. Reusing it.`);
}

const viteBin = 'node_modules/vite/bin/vite.js';
const vite = spawn(process.execPath, [viteBin, '--host', 'localhost', '--port', String(VITE_PORT)], {
  stdio: 'inherit', shell: false, env: { ...process.env, AQUAFLOW_BACKEND_PORT: String(backendPort) }
});
children.push(vite);
vite.on('error', e => { console.error(`[DEV FAILED] ${e.message}`); cleanup(1); });

function cleanup(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    try { child.kill('SIGTERM'); } catch {}
  }
  setTimeout(() => process.exit(code), 250);
}

vite.on('exit', (code, signal) => cleanup(signal ? 1 : (code ?? 0)));
process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));

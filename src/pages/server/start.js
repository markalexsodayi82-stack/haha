import { spawn } from 'node:child_process';
import process from 'node:process';
import { DEFAULT_PORT, aquaFlowHealth, findAvailablePort, findRunningAquaFlowPort, savePort } from './port-utils.js';

const requested = Number(process.env.PORT || DEFAULT_PORT);
const existing = await findRunningAquaFlowPort(requested, requested + 20);

if (existing) {
  await savePort(existing);
  console.log('========================================');
  console.log('        AQUAFLOW BACKEND');
  console.log('========================================');
  console.log(`Status: ALREADY ONLINE`);
  console.log(`Server: http://localhost:${existing}`);
  console.log(`Health: http://localhost:${existing}/api/health`);
  console.log('No second backend was started.');
  console.log('========================================');
  process.exit(0);
}

const port = await findAvailablePort(requested, requested + 20);
await savePort(port);

console.log(`[BACKEND] Port ${requested} is busy. Using available port ${port}.`);

const child = spawn(process.execPath, ['server/server.js'], {
  cwd: process.cwd(),
  stdio: 'inherit',
  windowsHide: false,
  env: { ...process.env, PORT: String(port) },
});

child.on('error', error => {
  console.error(`[BACKEND FAILED] ${error.message}`);
  process.exit(1);
});
child.on('exit', (code, signal) => {
  if (signal) process.exit(1);
  process.exit(code ?? 0);
});

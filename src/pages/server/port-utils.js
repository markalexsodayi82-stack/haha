import net from 'node:net';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const DEFAULT_PORT = Number(process.env.PORT || 8080);
const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
export const PORT_FILE = join(ROOT, '.aquaflow-port');

export async function isPortOpen(port) {
  return await new Promise(resolve => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    const done = value => { socket.destroy(); resolve(value); };
    socket.once('connect', () => done(true));
    socket.once('error', () => done(false));
    socket.setTimeout(300, () => done(false));
  });
}

export async function aquaFlowHealth(port) {
  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, { signal: AbortSignal.timeout(700) });
    if (!response.ok) return false;
    const data = await response.json();
    return data?.ok === true && data?.service === 'AquaFlow API';
  } catch {
    return false;
  }
}

export async function readSavedPort() {
  try {
    const port = Number((await readFile(PORT_FILE, 'utf8')).trim());
    return Number.isInteger(port) && port > 0 && port < 65536 ? port : null;
  } catch {
    return null;
  }
}

export async function savePort(port) {
  await writeFile(PORT_FILE, String(port), 'utf8');
}

export async function findAvailablePort(start = DEFAULT_PORT, end = start + 20) {
  for (let port = start; port <= end; port += 1) {
    if (!(await isPortOpen(port))) return port;
  }
  throw new Error(`No available AquaFlow backend port found between ${start} and ${end}.`);
}

export async function findRunningAquaFlowPort(start = DEFAULT_PORT, end = start + 20) {
  const saved = await readSavedPort();
  if (saved && await aquaFlowHealth(saved)) return saved;
  for (let port = start; port <= end; port += 1) {
    if (await aquaFlowHealth(port)) return port;
  }
  return null;
}

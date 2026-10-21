import { execFileSync } from 'node:child_process';
import { unlink } from 'node:fs/promises';
import process from 'node:process';
import { DEFAULT_PORT, aquaFlowHealth, readSavedPort } from './port-utils.js';

const saved = await readSavedPort();
const PORT = Number(process.env.PORT || saved || DEFAULT_PORT);

if (!(await aquaFlowHealth(PORT))) {
  try { await unlink('.aquaflow-port'); } catch {}
  console.log(`No AquaFlow backend is running on port ${PORT}.`);
  process.exit(0);
}

let pids = [];
try {
  if (process.platform === 'win32') {
    const out = execFileSync('powershell.exe', ['-NoProfile','-ExecutionPolicy','Bypass','-Command',
      `$c=Get-NetTCPConnection -LocalPort ${PORT} -State Listen -ErrorAction SilentlyContinue; if($c){$c.OwningProcess | Sort-Object -Unique}`], {encoding:'utf8',windowsHide:true});
    pids = out.split(/\r?\n/).map(x => Number(x.trim())).filter(Boolean);
  } else {
    const out = execFileSync('sh',['-lc',`lsof -nP -t -iTCP:${PORT} -sTCP:LISTEN 2>/dev/null || true`],{encoding:'utf8'});
    pids = out.split(/\r?\n/).map(x => Number(x.trim())).filter(Boolean);
  }
} catch {}

let stopped = 0;
for (const pid of pids) {
  try {
    if (process.platform === 'win32') execFileSync('taskkill.exe',['/PID',String(pid),'/T','/F'],{stdio:'ignore',windowsHide:true});
    else process.kill(pid,'SIGTERM');
    stopped++;
  } catch {}
}

try { await unlink('.aquaflow-port'); } catch {}
console.log(stopped ? `AquaFlow stopped. Port ${PORT} is released.` : `AquaFlow health was detected, but its process could not be stopped automatically.`);

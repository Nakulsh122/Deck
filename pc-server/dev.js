import { spawn } from 'child_process';

delete process.env.ELECTRON_RUN_AS_NODE;

const child = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

child.on('exit', (code) => {
  process.exit(code || 0);
});

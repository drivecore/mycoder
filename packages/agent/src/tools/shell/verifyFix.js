// Script to manually verify the shellStart fix
import { spawn } from 'child_process';

import { ShellTracker } from '../../../dist/tools/shell/ShellTracker.js';

// Create a shell tracker
const shellTracker = new ShellTracker('test');

// Register a shell
console.log('Registering shell...');
const shellId = shellTracker.registerShell('echo "test"');
console.log(`Shell registered with ID: ${shellId}`);

// Check initial state
console.log('Initial state:');
console.log(shellTracker.getShells());

// Create a child process
console.log('Starting process...');
const childProcess = spawn('echo', ['test'], { shell: true });

// Set up event handlers
childProcess.on('exit', (code) => {
  console.log(`Process exited with code ${code}`);

  // Update the shell status
  shellTracker.updateShellStatus(shellId, code === 0 ? 'completed' : 'error', {
    exitCode: code,
  });

  // Check final state
  console.log('Final state:');
  console.log(shellTracker.getShells());
  console.log('Running shells:', shellTracker.getShells('running').length);
  console.log('Completed shells:', shellTracker.getShells('completed').length);
});

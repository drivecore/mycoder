import { spawn } from 'child_process';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Test strings with problematic characters
const testStrings = [
  'Simple string',
  'String with spaces',
  'String with "double quotes"',
  'String with \'single quotes\'',
  'String with $variable',
  'String with `backticks`',
  'String with newline\ncharacter',
  'String with & and | operators',
  'String with > redirect',
  'String with * wildcard',
  'Complex string with "quotes", \'single\', $var, `backticks`, \n, and special chars &|><*'
];

console.log('=== Testing stdinContent approaches ===');

// Helper function to wait for all tests to complete
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to execute a command with encoded content
const execWithEncodedContent = async (command, content, isWindows = process.platform === 'win32') => {
  return new Promise((resolve, reject) => {
    const encodedContent = Buffer.from(content).toString('base64');
    let cmd;
    
    if (isWindows) {
      // Windows approach using PowerShell
      cmd = `powershell -Command "[System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${encodedContent}')) | ${command}"`;
    } else {
      // POSIX approach (Linux/macOS)
      cmd = `echo "${encodedContent}" | base64 -d | ${command}`;
    }
    
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

// Test Base64 encoding approach
console.log('\n=== Testing Base64 encoding approach ===');
for (const str of testStrings) {
  console.log(`\nOriginal: "${str}"`);
  
  try {
    // Test the encoded content approach
    const { stdout } = await execWithEncodedContent('cat', str);
    console.log(`Output: "${stdout.trim()}"`);
    console.log(`Success: ${stdout.trim() === str}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
  
  // Add a small delay to ensure orderly output
  await wait(100);
}

// Compare with temporary file approach (current workaround)
console.log('\n=== Comparing with temporary file approach ===');
for (const str of testStrings) {
  console.log(`\nOriginal: "${str}"`);
  
  // Create a temporary file with the content
  const tempFile = path.join(os.tmpdir(), `test-content-${Date.now()}.txt`);
  fs.writeFileSync(tempFile, str);
  
  // Execute command using the temporary file
  exec(`cat "${tempFile}"`, async (error, stdout, stderr) => {
    console.log(`Output (temp file): "${stdout.trim()}"`);
    console.log(`Success (temp file): ${stdout.trim() === str}`);
    
    try {
      // Test the encoded content approach
      const { stdout: encodedStdout } = await execWithEncodedContent('cat', str);
      console.log(`Output (encoded): "${encodedStdout.trim()}"`);
      console.log(`Success (encoded): ${encodedStdout.trim() === str}`);
      console.log(`Match: ${stdout.trim() === encodedStdout.trim()}`);
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
    
    // Clean up the temporary file
    fs.unlinkSync(tempFile);
  });
  
  // Add a small delay to ensure orderly output
  await wait(300);
}
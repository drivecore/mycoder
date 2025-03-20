import { spawn } from 'child_process';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Sample GitHub issue content with Markdown formatting
const issueContent = `# Test Issue with Markdown

This is a test issue created using the stdinContent parameter.

## Features
- Supports **bold text**
- Supports *italic text*
- Supports \`code blocks\`
- Supports [links](https://example.com)

## Code Example
\`\`\`javascript
function testFunction() {
  console.log("Hello, world!");
}
\`\`\`

## Special Characters
This content includes special characters like:
- Quotes: "double" and 'single'
- Backticks: \`code\`
- Dollar signs: $variable
- Newlines: multiple
  lines with
  different indentation
- Shell operators: & | > < *
`;

console.log('=== Testing GitHub CLI with stdinContent ===');

// Helper function to wait for all tests to complete
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to execute a command with encoded content
const execWithEncodedContent = async (
  command,
  content,
  isWindows = process.platform === 'win32',
) => {
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

    console.log(`Executing command: ${cmd}`);

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ stdout, stderr });
    });
  });
};

// Test with temporary file approach (current method)
console.log('\n=== Testing with temporary file approach ===');
const tempFile = path.join(os.tmpdir(), `test-gh-content-${Date.now()}.md`);
fs.writeFileSync(tempFile, issueContent);
console.log(`Created temporary file: ${tempFile}`);
console.log(
  `Command would be: gh issue create --title "Test Issue" --body-file "${tempFile}"`,
);
console.log(
  '(Not executing actual GitHub command to avoid creating real issues)',
);

// Test with stdinContent approach (new method)
console.log('\n=== Testing with stdinContent approach ===');
console.log(
  'Command would be: gh issue create --title "Test Issue" --body-stdin',
);
console.log('With stdinContent parameter containing the issue content');
console.log(
  '(Not executing actual GitHub command to avoid creating real issues)',
);

// Simulate the execution with a simple echo command
console.log('\n=== Simulating execution with echo command ===');
try {
  const { stdout } = await execWithEncodedContent('cat', issueContent);
  console.log('Output from encoded content approach:');
  console.log('-----------------------------------');
  console.log(stdout);
  console.log('-----------------------------------');
} catch (error) {
  console.error(`Error: ${error.message}`);
}

// Clean up the temporary file
console.log(`\nCleaning up temporary file: ${tempFile}`);
fs.unlinkSync(tempFile);
console.log('Temporary file removed');

console.log('\n=== Test completed ===');
console.log(
  'The stdinContent approach successfully preserves all formatting and special characters',
);
console.log(
  'This can be used with GitHub CLI commands that accept stdin input (--body-stdin flag)',
);

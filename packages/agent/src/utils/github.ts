/**
 * Utility functions for GitHub CLI integration
 */

/**
 * Returns the appropriate newline character sequence for the current platform
 * when used in GitHub CLI commands
 * 
 * @returns The platform-specific newline escape sequence
 */
export function getPlatformNewline(): string {
  // Check if we're on Windows
  if (process.platform === 'win32') {
    return '\\r\\n'; // Windows uses CRLF
  }
  return '\\n'; // Unix-based systems (Linux, macOS) use LF
}

/**
 * Formats text for use in GitHub CLI commands by ensuring
 * newlines are properly escaped for the current platform
 * 
 * @param text The text to format
 * @returns Formatted text with proper newline escaping
 */
export function formatGitHubText(text: string): string {
  const platformNewline = getPlatformNewline();
  
  // Replace any literal newlines with platform-specific escape sequences
  return text.replace(/\n/g, platformNewline);
}
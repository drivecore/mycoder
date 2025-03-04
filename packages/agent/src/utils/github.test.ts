import { describe, it, expect, vi } from 'vitest';

import { getPlatformNewline, formatGitHubText } from './github.js';

describe('GitHub utilities', () => {
  describe('getPlatformNewline', () => {
    it('should return \\n for non-Windows platforms', () => {
      // Mock process.platform to be 'darwin'
      vi.stubGlobal('process', { ...process, platform: 'darwin' });
      expect(getPlatformNewline()).toBe('\\n');
      
      // Mock process.platform to be 'linux'
      vi.stubGlobal('process', { ...process, platform: 'linux' });
      expect(getPlatformNewline()).toBe('\\n');
    });

    it('should return \\r\\n for Windows platform', () => {
      // Mock process.platform to be 'win32'
      vi.stubGlobal('process', { ...process, platform: 'win32' });
      expect(getPlatformNewline()).toBe('\\r\\n');
    });
  });

  describe('formatGitHubText', () => {
    it('should replace newlines with platform-specific escape sequences', () => {
      // Mock process.platform to be 'darwin'
      vi.stubGlobal('process', { ...process, platform: 'darwin' });
      
      const input = 'Hello\nWorld\nThis is a test';
      const expected = 'Hello\\nWorld\\nThis is a test';
      
      expect(formatGitHubText(input)).toBe(expected);
    });

    it('should handle Windows newlines correctly', () => {
      // Mock process.platform to be 'win32'
      vi.stubGlobal('process', { ...process, platform: 'win32' });
      
      const input = 'Hello\nWorld\nThis is a test';
      const expected = 'Hello\\r\\nWorld\\r\\nThis is a test';
      
      expect(formatGitHubText(input)).toBe(expected);
    });
  });
});
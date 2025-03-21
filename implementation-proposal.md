# Mycoder System Browser Detection Implementation Proposal

## Problem Statement

When mycoder is installed globally via `npm install -g mycoder`, users encounter issues with the browser automation functionality. This is because Playwright (the library used for browser automation) requires browsers to be installed separately, and these browsers are not automatically installed with the global npm installation.

## Proposed Solution

Modify mycoder to detect and use system-installed browsers (Chrome, Edge, Firefox, or Safari) instead of relying on Playwright's own browser installations. The solution will:

1. Look for existing installed browsers on the user's system in a cross-platform way (Windows, macOS, Linux)
2. Use the detected browser for automation via Playwright's `executablePath` option
3. Maintain the ability to run browsers in headless mode
4. Preserve the clean session behavior (equivalent to incognito/private browsing)

## Implementation Details

### 1. Create a Browser Detection Module

Create a new module in the agent package to handle browser detection across platforms:

```typescript
// packages/agent/src/tools/session/lib/BrowserDetector.ts

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';

export interface BrowserInfo {
  name: string;
  type: 'chromium' | 'firefox' | 'webkit';
  path: string;
}

export class BrowserDetector {
  /**
   * Detect available browsers on the system
   * Returns an array of browser information objects sorted by preference
   */
  static async detectBrowsers(): Promise<BrowserInfo[]> {
    const platform = process.platform;

    let browsers: BrowserInfo[] = [];

    switch (platform) {
      case 'darwin':
        browsers = await this.detectMacOSBrowsers();
        break;
      case 'win32':
        browsers = await this.detectWindowsBrowsers();
        break;
      case 'linux':
        browsers = await this.detectLinuxBrowsers();
        break;
      default:
        break;
    }

    return browsers;
  }

  /**
   * Detect browsers on macOS
   */
  private static async detectMacOSBrowsers(): Promise<BrowserInfo[]> {
    const browsers: BrowserInfo[] = [];

    // Chrome paths
    const chromePaths = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
      `${homedir()}/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`,
      `${homedir()}/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary`,
    ];

    // Edge paths
    const edgePaths = [
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      `${homedir()}/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge`,
    ];

    // Firefox paths
    const firefoxPaths = [
      '/Applications/Firefox.app/Contents/MacOS/firefox',
      '/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox',
      '/Applications/Firefox Nightly.app/Contents/MacOS/firefox',
      `${homedir()}/Applications/Firefox.app/Contents/MacOS/firefox`,
    ];

    // Check Chrome paths
    for (const chromePath of chromePaths) {
      if (this.canAccess(chromePath)) {
        browsers.push({
          name: 'Chrome',
          type: 'chromium',
          path: chromePath,
        });
      }
    }

    // Check Edge paths
    for (const edgePath of edgePaths) {
      if (this.canAccess(edgePath)) {
        browsers.push({
          name: 'Edge',
          type: 'chromium', // Edge is Chromium-based
          path: edgePath,
        });
      }
    }

    // Check Firefox paths
    for (const firefoxPath of firefoxPaths) {
      if (this.canAccess(firefoxPath)) {
        browsers.push({
          name: 'Firefox',
          type: 'firefox',
          path: firefoxPath,
        });
      }
    }

    return browsers;
  }

  /**
   * Detect browsers on Windows
   */
  private static async detectWindowsBrowsers(): Promise<BrowserInfo[]> {
    const browsers: BrowserInfo[] = [];

    // Common installation paths for Chrome
    const chromePaths = [
      path.join(
        process.env.LOCALAPPDATA || '',
        'Google/Chrome/Application/chrome.exe',
      ),
      path.join(
        process.env.PROGRAMFILES || '',
        'Google/Chrome/Application/chrome.exe',
      ),
      path.join(
        process.env['PROGRAMFILES(X86)'] || '',
        'Google/Chrome/Application/chrome.exe',
      ),
    ];

    // Common installation paths for Edge
    const edgePaths = [
      path.join(
        process.env.LOCALAPPDATA || '',
        'Microsoft/Edge/Application/msedge.exe',
      ),
      path.join(
        process.env.PROGRAMFILES || '',
        'Microsoft/Edge/Application/msedge.exe',
      ),
      path.join(
        process.env['PROGRAMFILES(X86)'] || '',
        'Microsoft/Edge/Application/msedge.exe',
      ),
    ];

    // Common installation paths for Firefox
    const firefoxPaths = [
      path.join(process.env.PROGRAMFILES || '', 'Mozilla Firefox/firefox.exe'),
      path.join(
        process.env['PROGRAMFILES(X86)'] || '',
        'Mozilla Firefox/firefox.exe',
      ),
    ];

    // Check Chrome paths
    for (const chromePath of chromePaths) {
      if (this.canAccess(chromePath)) {
        browsers.push({
          name: 'Chrome',
          type: 'chromium',
          path: chromePath,
        });
      }
    }

    // Check Edge paths
    for (const edgePath of edgePaths) {
      if (this.canAccess(edgePath)) {
        browsers.push({
          name: 'Edge',
          type: 'chromium', // Edge is Chromium-based
          path: edgePath,
        });
      }
    }

    // Check Firefox paths
    for (const firefoxPath of firefoxPaths) {
      if (this.canAccess(firefoxPath)) {
        browsers.push({
          name: 'Firefox',
          type: 'firefox',
          path: firefoxPath,
        });
      }
    }

    return browsers;
  }

  /**
   * Detect browsers on Linux
   */
  private static async detectLinuxBrowsers(): Promise<BrowserInfo[]> {
    const browsers: BrowserInfo[] = [];

    // Try to find Chrome/Chromium using the 'which' command
    const chromiumExecutables = [
      'google-chrome-stable',
      'google-chrome',
      'chromium-browser',
      'chromium',
    ];

    // Try to find Firefox using the 'which' command
    const firefoxExecutables = ['firefox'];

    // Check for Chrome/Chromium
    for (const executable of chromiumExecutables) {
      try {
        const browserPath = execSync(`which ${executable}`, { stdio: 'pipe' })
          .toString()
          .trim();
        if (this.canAccess(browserPath)) {
          browsers.push({
            name: executable,
            type: 'chromium',
            path: browserPath,
          });
        }
      } catch (e) {
        // Not installed
      }
    }

    // Check for Firefox
    for (const executable of firefoxExecutables) {
      try {
        const browserPath = execSync(`which ${executable}`, { stdio: 'pipe' })
          .toString()
          .trim();
        if (this.canAccess(browserPath)) {
          browsers.push({
            name: 'Firefox',
            type: 'firefox',
            path: browserPath,
          });
        }
      } catch (e) {
        // Not installed
      }
    }

    return browsers;
  }

  /**
   * Check if a file exists and is accessible
   */
  private static canAccess(filePath: string): boolean {
    try {
      fs.accessSync(filePath);
      return true;
    } catch (e) {
      return false;
    }
  }
}
```

### 2. Modify the SessionManager to Use Detected Browsers

Update the SessionManager to use the browser detection module:

```typescript
// packages/agent/src/tools/session/lib/SessionManager.ts

import { chromium, firefox } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

import {
  BrowserConfig,
  Session,
  BrowserError,
  BrowserErrorCode,
} from './types.js';
import { BrowserDetector, BrowserInfo } from './BrowserDetector.js';

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private readonly defaultConfig: BrowserConfig = {
    headless: true,
    defaultTimeout: 30000,
  };
  private detectedBrowsers: BrowserInfo[] = [];
  private browserDetectionPromise: Promise<void> | null = null;

  constructor() {
    // Store a reference to the instance globally for cleanup
    (globalThis as any).__BROWSER_MANAGER__ = this;

    // Set up cleanup handlers for graceful shutdown
    this.setupGlobalCleanup();

    // Start browser detection in the background
    this.browserDetectionPromise = this.detectBrowsers();
  }

  /**
   * Detect available browsers on the system
   */
  private async detectBrowsers(): Promise<void> {
    try {
      this.detectedBrowsers = await BrowserDetector.detectBrowsers();
      console.log(
        `Detected ${this.detectedBrowsers.length} browsers on the system`,
      );
    } catch (error) {
      console.error('Failed to detect system browsers:', error);
      this.detectedBrowsers = [];
    }
  }

  async createSession(config?: BrowserConfig): Promise<Session> {
    try {
      // Wait for browser detection to complete if it's still running
      if (this.browserDetectionPromise) {
        await this.browserDetectionPromise;
        this.browserDetectionPromise = null;
      }

      const sessionConfig = { ...this.defaultConfig, ...config };

      // Try to use a system browser if any were detected
      let browser;
      let browserInfo: BrowserInfo | undefined;

      // Prefer Chrome/Edge (Chromium-based browsers)
      browserInfo = this.detectedBrowsers.find((b) => b.type === 'chromium');

      if (browserInfo) {
        console.log(
          `Using system browser: ${browserInfo.name} at ${browserInfo.path}`,
        );

        // Launch the browser using the detected executable path
        if (browserInfo.type === 'chromium') {
          browser = await chromium.launch({
            headless: sessionConfig.headless,
            executablePath: browserInfo.path,
          });
        } else if (browserInfo.type === 'firefox') {
          browser = await firefox.launch({
            headless: sessionConfig.headless,
            executablePath: browserInfo.path,
          });
        }
      }

      // Fall back to Playwright's bundled browser if no system browser was found or launch failed
      if (!browser) {
        console.log(
          'No system browser detected or failed to launch, trying bundled browser',
        );
        browser = await chromium.launch({
          headless: sessionConfig.headless,
        });
      }

      // Create a new context (equivalent to incognito)
      const context = await browser.newContext({
        viewport: null,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      });

      const page = await context.newPage();
      page.setDefaultTimeout(sessionConfig.defaultTimeout ?? 30000);

      const session: Session = {
        browser,
        page,
        id: uuidv4(),
      };

      this.sessions.set(session.id, session);
      this.setupCleanup(session);

      return session;
    } catch (error) {
      throw new BrowserError(
        'Failed to create browser session',
        BrowserErrorCode.LAUNCH_FAILED,
        error,
      );
    }
  }

  // Rest of the class remains the same...
}
```

### 3. Add Configuration Options

Allow users to configure browser preferences in their mycoder.config.js:

```typescript
// Example mycoder.config.js with browser configuration
export default {
  // ... existing config

  // Browser configuration
  browser: {
    // Specify a custom browser executable path (overrides automatic detection)
    executablePath: null, // e.g., '/path/to/chrome'

    // Preferred browser type (chromium, firefox, webkit)
    preferredType: 'chromium',

    // Whether to use system browsers or Playwright's bundled browsers
    useSystemBrowsers: true,

    // Whether to run in headless mode
    headless: true,
  },
};
```

### 4. Update Documentation

Add information to the README.md about the browser detection feature and how to configure it.

## Benefits

1. **Improved User Experience**: Users can install mycoder globally without needing to manually install Playwright browsers.
2. **Reduced Disk Space**: Avoids duplicate browser installations if the user already has browsers installed.
3. **Cross-Platform Compatibility**: Works on Windows, macOS, and Linux.
4. **Flexibility**: Users can still configure custom browser paths if needed.

## Potential Challenges

1. **Compatibility Issues**: Playwright warns about compatibility with non-bundled browsers. We should test with different browser versions.
2. **Browser Versions**: Some features might not work with older browser versions.
3. **Headless Mode Support**: Not all system browsers might support headless mode in the same way.

## Testing Plan

1. Test browser detection on all three major platforms (Windows, macOS, Linux)
2. Test with different browser versions
3. Test headless mode functionality
4. Test incognito/clean session behavior
5. Test with custom browser paths

## Implementation Timeline

1. Create the browser detection module
2. Modify the SessionManager to use detected browsers
3. Add configuration options
4. Update documentation
5. Test on different platforms
6. Release as part of the next version update

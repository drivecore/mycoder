import { execSync } from 'child_process';
import fs from 'fs';
import { homedir } from 'os';
import path from 'path';

/**
 * Browser information interface
 */
export interface BrowserInfo {
  name: string;
  type: 'chromium' | 'firefox' | 'webkit';
  path: string;
}

/**
 * Check if a file exists and is accessible
 */
export function canAccess(filePath: string): boolean {
  try {
    fs.accessSync(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect browsers on macOS
 */
export async function detectMacOSBrowsers(): Promise<BrowserInfo[]> {
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
    if (canAccess(chromePath)) {
      browsers.push({
        name: 'Chrome',
        type: 'chromium',
        path: chromePath,
      });
    }
  }

  // Check Edge paths
  for (const edgePath of edgePaths) {
    if (canAccess(edgePath)) {
      browsers.push({
        name: 'Edge',
        type: 'chromium', // Edge is Chromium-based
        path: edgePath,
      });
    }
  }

  // Check Firefox paths
  for (const firefoxPath of firefoxPaths) {
    if (canAccess(firefoxPath)) {
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
export async function detectWindowsBrowsers(): Promise<BrowserInfo[]> {
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
    if (canAccess(chromePath)) {
      browsers.push({
        name: 'Chrome',
        type: 'chromium',
        path: chromePath,
      });
    }
  }

  // Check Edge paths
  for (const edgePath of edgePaths) {
    if (canAccess(edgePath)) {
      browsers.push({
        name: 'Edge',
        type: 'chromium', // Edge is Chromium-based
        path: edgePath,
      });
    }
  }

  // Check Firefox paths
  for (const firefoxPath of firefoxPaths) {
    if (canAccess(firefoxPath)) {
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
export async function detectLinuxBrowsers(): Promise<BrowserInfo[]> {
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
      if (canAccess(browserPath)) {
        browsers.push({
          name: executable,
          type: 'chromium',
          path: browserPath,
        });
      }
    } catch {
      // Not installed
    }
  }

  // Check for Firefox
  for (const executable of firefoxExecutables) {
    try {
      const browserPath = execSync(`which ${executable}`, { stdio: 'pipe' })
        .toString()
        .trim();
      if (canAccess(browserPath)) {
        browsers.push({
          name: 'Firefox',
          type: 'firefox',
          path: browserPath,
        });
      }
    } catch {
      // Not installed
    }
  }

  return browsers;
}

/**
 * Detect available browsers on the system
 * Returns an array of browser information objects sorted by preference
 */
export async function detectBrowsers(): Promise<BrowserInfo[]> {
  const platform = process.platform;
  let browsers: BrowserInfo[] = [];

  switch (platform) {
    case 'darwin':
      browsers = await detectMacOSBrowsers();
      break;
    case 'win32':
      browsers = await detectWindowsBrowsers();
      break;
    case 'linux':
      browsers = await detectLinuxBrowsers();
      break;
    default:
      console.log(`Unsupported platform: ${platform}`);
      break;
  }

  return browsers;
}

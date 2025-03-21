import type { Browser, Page } from '@playwright/test';

// Browser configuration
export interface BrowserConfig {
  headless?: boolean;
  defaultTimeout?: number;
  // Custom browser executable path (overrides automatic detection)
  executablePath?: string;
  // Preferred browser type (chromium, firefox, webkit)
  preferredType?: 'chromium' | 'firefox' | 'webkit';
  // Whether to use system browsers or Playwright's bundled browsers
  useSystemBrowsers?: boolean;
}

// Browser session
export interface Session {
  browser: Browser;
  page: Page;
  id: string;
}

// Browser error codes
export enum BrowserErrorCode {
  LAUNCH_FAILED = 'LAUNCH_FAILED',
  NAVIGATION_FAILED = 'NAVIGATION_FAILED',
  SESSION_ERROR = 'SESSION_ERROR',
  SELECTOR_ERROR = 'SELECTOR_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
  SELECTOR_INVALID = 'SELECTOR_INVALID',
  ELEMENT_NOT_FOUND = 'ELEMENT_NOT_FOUND',
}

// Browser error class
export class BrowserError extends Error {
  constructor(
    message: string,
    public code: BrowserErrorCode,
    public cause?: unknown,
  ) {
    super(message);
    this.name = 'BrowserError';
  }
}

// Selector types for element interaction
export enum SelectorType {
  CSS = 'css',
  XPATH = 'xpath',
  TEXT = 'text',
  ROLE = 'role',
  TESTID = 'testid',
}

// Selector options
export interface SelectorOptions {
  type?: SelectorType;
  timeout?: number;
  visible?: boolean;
}

// Global map to store browser sessions
export const browserSessions: Map<string, Session> = new Map();

// Browser action types
export type BrowserAction =
  | { actionType: 'goto'; url: string }
  | { actionType: 'click'; selector: string; selectorType?: SelectorType }
  | {
      actionType: 'type';
      selector: string;
      text: string;
      selectorType?: SelectorType;
    }
  | { actionType: 'wait'; selector: string; selectorType?: SelectorType }
  | { actionType: 'content' }
  | { actionType: 'close' };

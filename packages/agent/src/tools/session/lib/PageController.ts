import { Page } from '@playwright/test';

import { errorToString } from '../../../utils/errorToString.js';

import {
  SelectorType,
  SelectorOptions,
  BrowserError,
  BrowserErrorCode,
} from './types.js';

export class PageController {
  constructor(private page: Page) {}

  private getSelector(
    selector: string,
    type: SelectorType = SelectorType.CSS,
  ): string {
    switch (type) {
      case SelectorType.XPATH:
        return `xpath=${selector}`;
      case SelectorType.TEXT:
        return `text=${selector}`;
      case SelectorType.ROLE:
        return `role=${selector}`;
      case SelectorType.TESTID:
        return `[data-testid="${selector}"]`;
      default:
        return selector;
    }
  }

  private validateSelector(selector: string, _type: SelectorType): void {
    if (!selector) {
      throw new BrowserError(
        'Invalid selector: empty string',
        BrowserErrorCode.SELECTOR_INVALID,
      );
    }
    // TODO: Add more validation
  }

  async waitForSelector(
    selector: string,
    options: SelectorOptions = {},
  ): Promise<void> {
    this.validateSelector(selector, options.type || SelectorType.CSS);
    try {
      const locator = this.page.locator(
        this.getSelector(selector, options.type),
      );
      await locator.waitFor({
        state: options.visible ? 'visible' : 'attached',
        timeout: options.timeout,
      });
    } catch (error) {
      throw new BrowserError(
        `Failed to find element: ${errorToString(error)}`,
        BrowserErrorCode.ELEMENT_NOT_FOUND,
        error,
      );
    }
  }

  async click(selector: string, options: SelectorOptions = {}): Promise<void> {
    this.validateSelector(selector, options.type || SelectorType.CSS);
    try {
      const locator = this.page.locator(
        this.getSelector(selector, options.type),
      );
      await locator.click({ timeout: options.timeout });
    } catch (error) {
      throw new BrowserError(
        `Failed to click element: ${errorToString(error)}`,
        BrowserErrorCode.SELECTOR_ERROR,
        error,
      );
    }
  }

  async type(
    selector: string,
    text: string,
    options: SelectorOptions = {},
  ): Promise<void> {
    this.validateSelector(selector, options.type || SelectorType.CSS);
    try {
      const locator = this.page.locator(
        this.getSelector(selector, options.type),
      );
      await locator.fill(text, { timeout: options.timeout });
    } catch (error) {
      throw new BrowserError(
        `Failed to type text: ${errorToString(error)}`,
        BrowserErrorCode.SELECTOR_ERROR,
        error,
      );
    }
  }

  async getText(
    selector: string,
    options: SelectorOptions = {},
  ): Promise<string> {
    this.validateSelector(selector, options.type || SelectorType.CSS);
    try {
      const locator = this.page.locator(
        this.getSelector(selector, options.type),
      );
      return (await locator.textContent()) || '';
    } catch (error) {
      throw new BrowserError(
        `Failed to get text: ${errorToString(error)}`,
        BrowserErrorCode.SELECTOR_ERROR,
        error,
      );
    }
  }
}

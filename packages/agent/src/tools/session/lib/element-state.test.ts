import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from 'vitest';

import { SessionManager } from './SessionManager.js';
import { Session } from './types.js';

// Set global timeout for all tests in this file
vi.setConfig({ testTimeout: 15000 });

describe('Element State Tests', () => {
  let browserManager: SessionManager;
  let session: Session;
  const baseUrl = 'https://the-internet.herokuapp.com';

  beforeAll(async () => {
    browserManager = new SessionManager();
    session = await browserManager.createSession({ headless: true });
  });

  afterAll(async () => {
    await browserManager.closeAllSessions();
  });

  describe('Checkbox Tests', () => {
    beforeEach(async () => {
      await session.page.goto(`${baseUrl}/checkboxes`);
    });

    it('should verify initial checkbox states', async () => {
      const checkboxes = await session.page.$$('input[type="checkbox"]');
      expect(checkboxes).toHaveLength(2);

      const initialStates: boolean[] = [];
      for (const checkbox of checkboxes) {
        const isChecked = await checkbox.evaluate(
          (el) => (el as HTMLInputElement).checked,
        );
        initialStates.push(isChecked);
      }

      expect(initialStates[0]).toBe(false);
      expect(initialStates[1]).toBe(true);
    });

    it('should toggle checkbox states', async () => {
      const checkboxes = await session.page.$$('input[type="checkbox"]');
      if (!checkboxes[0] || !checkboxes[1])
        throw new Error('Checkboxes not found');

      // Toggle first checkbox
      await checkboxes[0].click();
      const newState = await checkboxes[0].evaluate(
        (el) => (el as HTMLInputElement).checked,
      );
      expect(newState).toBe(true);

      // Toggle second checkbox
      await checkboxes[1].click();
      const secondState = await checkboxes[1].evaluate(
        (el) => (el as HTMLInputElement).checked,
      );
      expect(secondState).toBe(false);
    });

    it('should maintain checkbox states after page refresh', async () => {
      const checkboxes = await session.page.$$('input[type="checkbox"]');
      if (!checkboxes[0]) throw new Error('First checkbox not found');
      await checkboxes[0].click(); // Toggle first checkbox

      await session.page.reload();

      const newCheckboxes = await session.page.$$('input[type="checkbox"]');
      const states: boolean[] = [];
      for (const checkbox of newCheckboxes) {
        const isChecked = await checkbox.evaluate(
          (el) => (el as HTMLInputElement).checked,
        );
        states.push(isChecked);
      }

      // After refresh, should return to default states
      expect(states[0]).toBe(false);
      expect(states[1]).toBe(true);
    });
  });

  describe('Dynamic Controls Tests', () => {
    beforeEach(async () => {
      await session.page.goto(`${baseUrl}/dynamic_controls`);
    });

    it('should handle enabled/disabled element states', async () => {
      // Wait for the input to be present and verify initial disabled state
      await session.page.waitForSelector('input[type="text"][disabled]');

      // Click the enable button
      await session.page.click('button:has-text("Enable")');

      // Wait for the message indicating the input is enabled
      await session.page.waitForSelector('#message', {
        state: 'visible',
        timeout: 5000,
      });

      // Verify the input is now enabled
      const input = await session.page.waitForSelector(
        'input[type="text"]:not([disabled])',
        {
          state: 'visible',
          timeout: 5000,
        },
      );

      if (!input) throw new Error('Enabled input not found');

      const isEnabled = await input.evaluate(
        (el) => !(el as HTMLInputElement).disabled,
      );
      expect(isEnabled).toBe(true);
    });
  });
});

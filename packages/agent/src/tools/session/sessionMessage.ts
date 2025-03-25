import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { errorToString } from '../../utils/errorToString.js';
import { sleep } from '../../utils/sleep.js';

import { filterPageContent } from './lib/filterPageContent.js';
import { SelectorType } from './lib/types.js';
import { SessionStatus } from './SessionTracker.js';

// Main parameter schema
const parameterSchema = z.object({
  instanceId: z.string().describe('The ID returned by sessionStart'),
  actionType: z
    .enum(['goto', 'click', 'type', 'wait', 'content', 'close'])
    .describe('Browser action to perform'),
  url: z
    .string()
    .url()
    .optional()
    .describe('URL to navigate to if "goto" actionType'),
  selector: z
    .string()
    .optional()
    .describe('Selector to click if "click" actionType'),
  selectorType: z
    .nativeEnum(SelectorType)
    .optional()
    .describe('Type of selector if "click" actionType'),
  text: z
    .string()
    .optional()
    .describe(
      'Text to type if "type" actionType, for other actionType, this is ignored',
    ),
  contentFilter: z
    .enum(['raw', 'smartMarkdown'])
    .optional()
    .describe(
      'Content filter method to use when retrieving page content, raw is the full dom (perfect for figuring out what to click or where to enter in text or what the page looks like), smartMarkdown is best for research, it extracts the text content as a markdown doc.',
    ),
  description: z
    .string()
    .describe('The reason for this browser action (max 80 chars)'),
});

// Return schema
const returnSchema = z.object({
  status: z.string(),
  content: z.string().optional(),
  error: z.string().optional(),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

// Helper function to handle selectors
const getSelector = (selector: string, type?: SelectorType): string => {
  switch (type) {
    case SelectorType.XPATH:
      return `xpath=${selector}`;
    case SelectorType.TEXT:
      return `text=${selector}`;
    case SelectorType.ROLE:
      return `role=${selector}`;
    case SelectorType.TESTID:
      return `data-testid=${selector}`;
    case SelectorType.CSS:
    default:
      return selector;
  }
};

export const sessionMessageTool: Tool<Parameters, ReturnType> = {
  name: 'sessionMessage',
  logPrefix: '🏄',
  description: 'Performs actions in an active browser session',
  parameters: parameterSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returns: returnSchema,
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    {
      instanceId,
      actionType,
      url,
      selector,
      selectorType = SelectorType.CSS,
      text,
      contentFilter,
    },
    context,
  ): Promise<ReturnType> => {
    const { logger, browserTracker } = context;
    const effectiveContentFilter = contentFilter || 'raw';

    logger.debug(
      `Browser action: ${actionType} on session ${instanceId.slice(0, 8)}`,
    );

    try {
      // Get the session info
      const sessionInfo = browserTracker.getSessionById(instanceId);
      if (!sessionInfo) {
        console.log(browserTracker.getSessions());
        throw new Error(`Session ${instanceId} not found`);
      }

      // Get the browser session
      const session = browserTracker.getSession(instanceId);
      const page = session.page;

      // Update session metadata
      browserTracker.updateSessionStatus(instanceId, SessionStatus.RUNNING, {
        actionType,
      });

      // Execute the appropriate action based on actionType
      switch (actionType) {
        case 'goto': {
          if (!url) {
            throw new Error('URL is required for goto action');
          }

          // Navigate to the URL
          try {
            await page.goto(url, {
              waitUntil: 'domcontentloaded',
              timeout: 30000,
            });
            await sleep(1000);
          } catch (error) {
            logger.warn(
              `Failed to navigate with domcontentloaded: ${errorToString(
                error,
              )}`,
            );
            // Try again with no waitUntil
            await page.goto(url, { timeout: 30000 });
            await sleep(1000);
          }

          // Get content after navigation
          const content = await filterPageContent(
            page,
            effectiveContentFilter,
            context,
          );

          return {
            status: 'success',
            content,
          };
        }

        case 'click': {
          if (!selector) {
            throw new Error('Selector is required for click action');
          }

          const fullSelector = getSelector(selector, selectorType);
          logger.debug(`Clicking element with selector: ${fullSelector}`);

          // Wait for the element to be visible
          await page.waitForSelector(fullSelector, { state: 'visible' });
          await page.click(fullSelector);
          await sleep(1000);

          // Get content after click
          const content = await filterPageContent(
            page,
            effectiveContentFilter,
            context,
          );

          return {
            status: 'success',
            content,
          };
        }

        case 'type': {
          if (!selector) {
            throw new Error('Selector is required for type action');
          }
          if (!text) {
            throw new Error('Text is required for type action');
          }

          const fullSelector = getSelector(selector, selectorType);
          logger.debug(
            `Typing "${text.substring(0, 20)}${
              text.length > 20 ? '...' : ''
            }" into element with selector: ${fullSelector}`,
          );

          // Wait for the element to be visible
          await page.waitForSelector(fullSelector, { state: 'visible' });
          await page.fill(fullSelector, text);
          await sleep(500);

          // Get content after typing
          const content = await filterPageContent(
            page,
            effectiveContentFilter,
            context,
          );

          return {
            status: 'success',
            content,
          };
        }

        case 'wait': {
          if (!selector) {
            throw new Error('Selector is required for wait action');
          }

          const fullSelector = getSelector(selector, selectorType);
          logger.debug(`Waiting for element with selector: ${fullSelector}`);

          // Wait for the element to be visible
          await page.waitForSelector(fullSelector, { state: 'visible' });
          await sleep(500);

          // Get content after waiting
          const content = await filterPageContent(
            page,
            effectiveContentFilter,
            context,
          );

          return {
            status: 'success',
            content,
          };
        }

        case 'content': {
          // Just get the current page content
          const content = await filterPageContent(
            page,
            effectiveContentFilter,
            context,
          );

          return {
            status: 'success',
            content,
          };
        }

        case 'close': {
          // Close the browser session
          await browserTracker.closeSession(instanceId);

          return {
            status: 'closed',
          };
        }

        default:
          throw new Error(`Unsupported action type: ${actionType}`);
      }
    } catch (error) {
      logger.error(`Browser action failed: ${errorToString(error)}`);

      // Update session status if we have a valid instanceId
      if (instanceId) {
        browserTracker.updateSessionStatus(instanceId, SessionStatus.ERROR, {
          error: errorToString(error),
        });
      }

      return {
        status: 'error',
        error: errorToString(error),
      };
    }
  },

  logParameters: (
    { actionType, instanceId, url, selector, text: _text, description },
    { logger },
  ) => {
    const shortId = instanceId.substring(0, 8);
    switch (actionType) {
      case 'goto':
        logger.log(`Navigating browser ${shortId} to ${url}, ${description}`);
        break;
      case 'click':
        logger.log(
          `Clicking element "${selector}" in browser ${shortId}, ${description}`,
        );
        break;
      case 'type':
        logger.log(
          `Typing into element "${selector}" in browser ${shortId}, ${description}`,
        );
        break;
      case 'wait':
        logger.log(
          `Waiting for element "${selector}" in browser ${shortId}, ${description}`,
        );
        break;
      case 'content':
        logger.log(`Getting content from browser ${shortId}, ${description}`);
        break;
      case 'close':
        logger.log(`Closing browser ${shortId}, ${description}`);
        break;
    }
  },

  logReturns: (output, { logger }) => {
    if (output.error) {
      logger.error(`Browser action failed: ${output.error}`);
    } else {
      logger.log(
        `Browser action completed with status: ${output.status}${
          output.content
            ? ` (content length: ${output.content.length} characters)`
            : ''
        }`,
      );
    }
  },
};

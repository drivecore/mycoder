import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { errorToString } from '../../utils/errorToString.js';
import { sleep } from '../../utils/sleep.js';

import { filterPageContent } from './lib/filterPageContent.js';
import { browserSessions, SelectorType } from './lib/types.js';
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
    .describe('Content filter method to use when retrieving page content'),
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
    default:
      return selector; // CSS selector is default
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
      selectorType,
      text,
      contentFilter = 'raw',
    },
    context,
  ): Promise<ReturnType> => {
    const { logger, browserTracker } = context;

    // Validate action format
    if (!actionType) {
      logger.error('Invalid action format: actionType is required');
      return {
        status: 'error',
        error: 'Invalid action format: actionType is required',
      };
    }

    logger.debug(`Executing browser action: ${actionType}`);
    logger.debug(`Webpage processing mode: ${contentFilter}`);

    try {
      const session = browserSessions.get(instanceId);
      if (!session) {
        throw new Error(`No browser session found with ID ${instanceId}`);
      }

      const { page } = session;

      switch (actionType) {
        case 'goto': {
          if (!url) {
            throw new Error('URL required for goto action');
          }

          try {
            // Try with 'domcontentloaded' first which is more reliable than 'networkidle'
            logger.debug(
              `Navigating to ${url} with 'domcontentloaded' waitUntil`,
            );
            await page.goto(url, { waitUntil: 'domcontentloaded' });
            await sleep(3000);
            const content = await filterPageContent(
              page,
              contentFilter,
              context,
            );
            logger.debug(`Content: ${content}`);
            logger.debug('Navigation completed with domcontentloaded strategy');
            logger.debug(`Content length: ${content.length} characters`);
            return { status: 'success', content };
          } catch (navError) {
            // If that fails, try with no waitUntil option
            logger.warn(
              `Failed with domcontentloaded strategy: ${errorToString(navError)}`,
            );
            logger.debug(
              `Retrying navigation to ${url} with no waitUntil option`,
            );

            try {
              await page.goto(url);
              await sleep(3000);
              const content = await filterPageContent(
                page,
                contentFilter,
                context,
              );
              logger.debug(`Content: ${content}`);
              logger.debug('Navigation completed with basic strategy');
              return { status: 'success', content };
            } catch (innerError) {
              logger.error(
                `Failed with basic navigation strategy: ${errorToString(innerError)}`,
              );
              throw innerError; // Re-throw to be caught by outer catch block
            }
          }
        }

        case 'click': {
          if (!selector) {
            throw new Error('Selector required for click action');
          }
          const clickSelector = getSelector(selector, selectorType);
          await page.click(clickSelector);
          await sleep(1000); // Wait for any content changes after click
          const content = await filterPageContent(page, contentFilter, context);
          logger.debug(`Click action completed on selector: ${clickSelector}`);
          return { status: 'success', content };
        }

        case 'type': {
          if (!selector || !text) {
            throw new Error('Selector and text required for type action');
          }
          const typeSelector = getSelector(selector, selectorType);
          await page.fill(typeSelector, text);
          logger.debug(`Type action completed on selector: ${typeSelector}`);
          return { status: 'success' };
        }

        case 'wait': {
          if (!selector) {
            throw new Error('Selector required for wait action');
          }
          const waitSelector = getSelector(selector, selectorType);
          await page.waitForSelector(waitSelector);
          logger.debug(`Wait action completed for selector: ${waitSelector}`);
          return { status: 'success' };
        }

        case 'content': {
          const content = await filterPageContent(page, contentFilter, context);
          logger.debug('Page content retrieved successfully');
          logger.debug(`Content length: ${content.length} characters`);
          return { status: 'success', content };
        }

        case 'close': {
          await session.page.context().close();
          await session.browser.close();
          browserSessions.delete(instanceId);

          // Update browser tracker when browser is explicitly closed
          browserTracker.updateSessionStatus(
            instanceId,
            SessionStatus.COMPLETED,
            {
              closedExplicitly: true,
            },
          );

          logger.debug('Browser session closed successfully');
          return { status: 'closed' };
        }

        default: {
          throw new Error(`Unsupported action type: ${actionType}`);
        }
      }
    } catch (error) {
      logger.error('Browser action failed:', { error });

      // Update browser tracker with error status if action fails
      browserTracker.updateSessionStatus(instanceId, SessionStatus.ERROR, {
        error: errorToString(error),
        actionType,
      });

      return {
        status: 'error',
        error: errorToString(error),
      };
    }
  },

  logParameters: ({ actionType, description, contentFilter }, { logger }) => {
    const effectiveContentFilter = contentFilter || 'raw';
    logger.log(
      `Performing browser action: ${actionType} with ${effectiveContentFilter} processing, ${description}`,
    );
  },

  logReturns: (output, { logger }) => {
    if (output.error) {
      logger.error(`Browser action failed: ${output.error}`);
    } else {
      logger.log(`Browser action completed with status: ${output.status}`);
    }
  },
};

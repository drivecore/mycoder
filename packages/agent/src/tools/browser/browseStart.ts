import { chromium } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { BackgroundToolStatus } from '../../core/backgroundTools.js';
import { Tool } from '../../core/types.js';
import { errorToString } from '../../utils/errorToString.js';
import { sleep } from '../../utils/sleep.js';

import { filterPageContent } from './filterPageContent.js';
import { browserSessions } from './types.js';

const parameterSchema = z.object({
  url: z.string().url().optional().describe('Initial URL to navigate to'),
  timeout: z
    .number()
    .optional()
    .describe('Default timeout in milliseconds (default: 30000)'),
  description: z
    .string()
    .describe('The reason for starting this browser session (max 80 chars)'),
});

const returnSchema = z.object({
  instanceId: z.string(),
  status: z.string(),
  content: z.string().optional(),
  error: z.string().optional(),
});

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

export const browseStartTool: Tool<Parameters, ReturnType> = {
  name: 'browseStart',
  logPrefix: '🏄',
  description: 'Starts a new browser session with optional initial URL',
  parameters: parameterSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returns: returnSchema,
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    { url, timeout = 30000 },
    { logger, headless, userSession, pageFilter, agentId, backgroundTools },
  ): Promise<ReturnType> => {
    logger.verbose(`Starting browser session${url ? ` at ${url}` : ''}`);
    logger.verbose(
      `User session mode: ${userSession ? 'enabled' : 'disabled'}`,
    );
    logger.verbose(`Webpage processing mode: ${pageFilter}`);

    try {
      const instanceId = uuidv4();

      // Register this browser session with the background tool registry
      backgroundTools.registerBrowser(url);

      // Launch browser
      const launchOptions = {
        headless,
      };

      // Use system Chrome installation if userSession is true
      if (userSession) {
        logger.verbose('Using system Chrome installation');
        // For Chrome, we use the channel option to specify Chrome
        launchOptions['channel'] = 'chrome';
      }

      const browser = await chromium.launch(launchOptions);

      // Create new context with default settings
      const context = await browser.newContext({
        viewport: null,
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        serviceWorkers: 'block', // Block service workers which can cause continuous network activity
      });

      // Create new page
      const page = await context.newPage();
      page.setDefaultTimeout(timeout);

      // Initialize browser session
      const session = {
        browser,
        page,
        id: instanceId,
      };

      browserSessions.set(instanceId, session);

      // Setup cleanup handlers
      browser.on('disconnected', () => {
        browserSessions.delete(instanceId);
        // Update background tool registry when browser disconnects
        backgroundTools.updateToolStatus(
          instanceId,
          BackgroundToolStatus.TERMINATED,
        );
      });

      // Navigate to URL if provided
      let content = '';
      if (url) {
        try {
          // Try with 'domcontentloaded' first which is more reliable than 'networkidle'
          logger.verbose(
            `Navigating to ${url} with 'domcontentloaded' waitUntil`,
          );
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
          await sleep(3000);
          content = await filterPageContent(page, pageFilter);
          logger.verbose(`Content: ${content}`);
          logger.verbose('Navigation completed with domcontentloaded strategy');
        } catch (error) {
          // If that fails, try with no waitUntil option at all (most basic)
          logger.warn(
            `Failed with domcontentloaded strategy: ${errorToString(error)}`,
          );
          logger.verbose(
            `Retrying navigation to ${url} with no waitUntil option`,
          );

          try {
            await page.goto(url, { timeout });
            await sleep(3000);
            content = await filterPageContent(page, pageFilter);
            logger.verbose(`Content: ${content}`);
            logger.verbose('Navigation completed with basic strategy');
          } catch (innerError) {
            logger.error(
              `Failed with basic navigation strategy: ${errorToString(innerError)}`,
            );
            throw innerError; // Re-throw to be caught by outer catch block
          }
        }
      }

      logger.verbose('Browser session started successfully');
      logger.verbose(`Content length: ${content.length} characters`);

      // Update background tool registry with running status
      backgroundTools.updateToolStatus(
        instanceId,
        BackgroundToolStatus.RUNNING,
        {
          url: url || 'about:blank',
          contentLength: content.length,
        },
      );

      return {
        instanceId,
        status: 'initialized',
        content: content || undefined,
      };
    } catch (error) {
      logger.error(`Failed to start browser: ${errorToString(error)}`);

      // No need to update background tool registry here as we don't have a valid instanceId
      // when an error occurs before the browser is properly initialized

      return {
        instanceId: '',
        status: 'error',
        error: errorToString(error),
      };
    }
  },

  logParameters: ({ url, description }, { logger, pageFilter = 'simple' }) => {
    logger.info(
      `Starting browser session${url ? ` at ${url}` : ''} with ${pageFilter} processing, ${description}`,
    );
  },

  logReturns: (output, { logger }) => {
    if (output.error) {
      logger.error(`Browser start failed: ${output.error}`);
    } else {
      logger.info(`Browser session started with ID: ${output.instanceId}`);
    }
  },
};

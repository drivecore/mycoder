import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';
import { errorToString } from '../../utils/errorToString.js';
import { sleep } from '../../utils/sleep.js';

import { detectBrowsers } from './lib/browserDetectors.js';
import { filterPageContent } from './lib/filterPageContent.js';
import { BrowserConfig } from './lib/types.js';
import { SessionStatus } from './SessionTracker.js';

const parameterSchema = z.object({
  url: z.string().url().optional().describe('Initial URL to navigate to'),
  timeout: z
    .number()
    .optional()
    .describe('Default timeout in milliseconds (default: 30000)'),
  contentFilter: z
    .enum(['raw', 'smartMarkdown'])
    .optional()
    .describe('Content filter method to use when retrieving page content'),
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

export const sessionStartTool: Tool<Parameters, ReturnType> = {
  name: 'sessionStart',
  logPrefix: '🏄',
  description: 'Starts a new browser session with optional initial URL',
  parameters: parameterSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returns: returnSchema,
  returnsJsonSchema: zodToJsonSchema(returnSchema),

  execute: async (
    { url, timeout = 30000, contentFilter },
    context,
  ): Promise<ReturnType> => {
    const { logger, headless, userSession, browserTracker, ...otherContext } =
      context;

    // Use provided contentFilter or default to 'raw'
    const effectiveContentFilter = contentFilter || 'raw';
    // Get config from context if available
    const config = (otherContext as any).config || {};
    logger.debug(`Starting browser session${url ? ` at ${url}` : ''}`);
    logger.debug(`User session mode: ${userSession ? 'enabled' : 'disabled'}`);
    logger.debug(`Webpage processing mode: ${effectiveContentFilter}`);

    try {
      // Register this browser session with the tracker
      const instanceId = browserTracker.registerBrowser(url);

      // Get browser configuration from config
      const browserConfig = config.browser || {};

      // Create browser configuration
      const sessionConfig: BrowserConfig = {
        headless,
        defaultTimeout: timeout,
        useSystemBrowsers: browserConfig.useSystemBrowsers !== false,
        preferredType: browserConfig.preferredType || 'chromium',
        executablePath: browserConfig.executablePath,
      };

      // If userSession is true, use system Chrome
      if (userSession) {
        logger.debug('User session mode enabled, forcing system Chrome');
        sessionConfig.useSystemBrowsers = true;
        sessionConfig.preferredType = 'chromium';

        // Try to detect Chrome browser
        const browsers = await detectBrowsers(logger);
        const chrome = browsers.find((b) =>
          b.name.toLowerCase().includes('chrome'),
        );
        if (chrome) {
          logger.debug(`Found system Chrome at ${chrome.path}`);
          sessionConfig.executablePath = chrome.path;
        }
      }

      logger.debug(`Browser config: ${JSON.stringify(sessionConfig)}`);

      // Create a session directly using the browserTracker
      const sessionId = await browserTracker.createSession(sessionConfig);
      
      // Get reference to the page
      const page = browserTracker.getSessionPage(sessionId);

      // Navigate to URL if provided
      let content = '';
      if (url) {
        try {
          // Try with 'domcontentloaded' first which is more reliable than 'networkidle'
          logger.debug(
            `Navigating to ${url} with 'domcontentloaded' waitUntil`,
          );
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
          await sleep(3000);
          content = await filterPageContent(
            page,
            effectiveContentFilter,
            context,
          );
          logger.debug(`Content: ${content}`);
          logger.debug('Navigation completed with domcontentloaded strategy');
        } catch (error) {
          // If that fails, try with no waitUntil option at all (most basic)
          logger.warn(
            `Failed with domcontentloaded strategy: ${errorToString(error)}`,
          );
          logger.debug(
            `Retrying navigation to ${url} with no waitUntil option`,
          );

          try {
            await page.goto(url, { timeout });
            await sleep(3000);
            content = await filterPageContent(
              page,
              effectiveContentFilter,
              context,
            );
            logger.debug(`Content: ${content}`);
            logger.debug('Navigation completed with basic strategy');
          } catch (innerError) {
            logger.error(
              `Failed with basic navigation strategy: ${errorToString(innerError)}`,
            );
            throw innerError; // Re-throw to be caught by outer catch block
          }
        }
      }

      logger.debug('Browser session started successfully');
      logger.debug(`Content length: ${content.length} characters`);

      // Update browser tracker with running status
      browserTracker.updateSessionStatus(instanceId, SessionStatus.RUNNING, {
        url: url || 'about:blank',
        contentLength: content.length,
      });

      return {
        instanceId,
        status: 'initialized',
        content: content || undefined,
      };
    } catch (error) {
      logger.error(`Failed to start browser: ${errorToString(error)}`);

      // No need to update browser tracker here as we don't have a valid instanceId
      // when an error occurs before the browser is properly initialized

      return {
        instanceId: '',
        status: 'error',
        error: errorToString(error),
      };
    }
  },

  logParameters: ({ url, description, contentFilter }, { logger }) => {
    const effectiveContentFilter = contentFilter || 'raw';
    logger.log(
      `Starting browser session${url ? ` at ${url}` : ''} with ${effectiveContentFilter} processing, ${description}`,
    );
  },

  logReturns: (output, { logger }) => {
    if (output.error) {
      logger.error(`Browser start failed: ${output.error}`);
    } else {
      logger.log(`Browser session started with ID: ${output.instanceId}`);
    }
  },
};

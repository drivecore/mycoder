import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { Tool } from '../../core/types.js';

const parameterSchema = z.object({
  method: z
    .string()
    .describe(
      'HTTP method to use (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)',
    ),
  url: z.string().describe('URL to make the request to'),
  params: z
    .record(z.any())
    .optional()
    .describe('Optional query parameters to append to the URL'),
  body: z
    .record(z.any())
    .optional()
    .describe('Optional request body (for POST, PUT, PATCH requests)'),
  headers: z.record(z.string()).optional().describe('Optional request headers'),
  // New parameters for error handling
  maxRetries: z
    .number()
    .min(0)
    .max(5)
    .optional()
    .describe('Maximum number of retries for 4xx errors (default: 3)'),
  retryDelay: z
    .number()
    .min(100)
    .max(30000)
    .optional()
    .describe('Initial delay in ms before retrying (default: 1000)'),
  slowMode: z
    .boolean()
    .optional()
    .describe('Enable slow mode to avoid rate limits (default: false)'),
});

const returnSchema = z
  .object({
    status: z.number(),
    statusText: z.string(),
    headers: z.record(z.string()),
    body: z.union([z.string(), z.record(z.any())]),
    retries: z.number().optional(),
    slowModeEnabled: z.boolean().optional(),
  })
  .describe('HTTP response including status, headers, and body');

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

/**
 * Sleep for a specified number of milliseconds
 * @param ms Milliseconds to sleep
 * @internal
 */
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay with jitter
 * @param attempt Current attempt number (0-based)
 * @param baseDelay Base delay in milliseconds
 * @returns Delay in milliseconds with jitter
 */
const calculateBackoff = (attempt: number, baseDelay: number): number => {
  // Calculate exponential backoff: baseDelay * 2^attempt
  const expBackoff = baseDelay * Math.pow(2, attempt);

  // Add jitter (±20%) to avoid thundering herd problem
  const jitter = expBackoff * 0.2 * (Math.random() * 2 - 1);

  // Return backoff with jitter, capped at 30 seconds
  return Math.min(expBackoff + jitter, 30000);
};

export const fetchTool: Tool<Parameters, ReturnType> = {
  name: 'fetch',
  description:
    'Executes HTTP requests using native Node.js fetch API, for using APIs, not for browsing the web.',
  logPrefix: '🌐',
  parameters: parameterSchema,
  returns: returnSchema,
  parametersJsonSchema: zodToJsonSchema(parameterSchema),
  returnsJsonSchema: zodToJsonSchema(returnSchema),
  execute: async (
    {
      method,
      url,
      params,
      body,
      headers,
      maxRetries = 3,
      retryDelay = 1000,
      slowMode = false,
    }: Parameters,
    { logger },
  ): Promise<ReturnType> => {
    let retries = 0;
    let slowModeEnabled = slowMode;
    let lastError: Error | null = null;

    while (retries <= maxRetries) {
      try {
        // If in slow mode, add a delay before making the request
        if (slowModeEnabled && retries > 0) {
          const slowModeDelay = 2000; // 2 seconds delay in slow mode
          logger.debug(
            `Slow mode enabled, waiting ${slowModeDelay}ms before request`,
          );
          await sleep(slowModeDelay);
        }

        logger.debug(
          `Starting ${method} request to ${url}${retries > 0 ? ` (retry ${retries}/${maxRetries})` : ''}`,
        );
        const urlObj = new URL(url);

        // Add query parameters
        if (params) {
          logger.debug('Adding query parameters:', params);
          Object.entries(params).forEach(([key, value]) =>
            urlObj.searchParams.append(key, value as string),
          );
        }

        // Prepare request options
        const options = {
          method,
          headers: {
            ...(body &&
              !['GET', 'HEAD'].includes(method) && {
                'content-type': 'application/json',
              }),
            ...headers,
          },
          ...(body &&
            !['GET', 'HEAD'].includes(method) && {
              body: JSON.stringify(body),
            }),
        };

        logger.debug('Request options:', options);
        const response = await fetch(urlObj.toString(), options);
        logger.debug(
          `Request completed with status ${response.status} ${response.statusText}`,
        );

        // Handle different 4xx errors
        if (response.status >= 400 && response.status < 500) {
          if (response.status === 400) {
            // Bad Request - might be a temporary issue or problem with the request
            if (retries < maxRetries) {
              retries++;
              const delay = calculateBackoff(retries, retryDelay);
              logger.warn(
                `400 Bad Request Error. Retrying in ${Math.round(delay)}ms (${retries}/${maxRetries})`,
              );
              await sleep(delay);
              continue;
            } else {
              // Throw an error after max retries for bad request
              throw new Error(
                `Failed after ${maxRetries} retries: Bad Request (400)`,
              );
            }
          } else if (response.status === 429) {
            // Rate Limit Exceeded - implement exponential backoff
            if (retries < maxRetries) {
              retries++;
              // Enable slow mode after the first rate limit error
              slowModeEnabled = true;

              // Get retry-after header if available, or use exponential backoff
              const retryAfter = response.headers.get('retry-after');
              let delay: number;

              if (retryAfter) {
                // If retry-after contains a timestamp
                if (isNaN(Number(retryAfter))) {
                  const retryDate = new Date(retryAfter).getTime();
                  delay = retryDate - Date.now();
                } else {
                  // If retry-after contains seconds
                  delay = parseInt(retryAfter, 10) * 1000;
                }
              } else {
                // Use exponential backoff if no retry-after header
                delay = calculateBackoff(retries, retryDelay);
              }

              logger.warn(
                `429 Rate Limit Exceeded. Enabling slow mode and retrying in ${Math.round(delay)}ms (${retries}/${maxRetries})`,
              );
              await sleep(delay);
              continue;
            } else {
              // Throw an error after max retries for rate limit
              throw new Error(
                `Failed after ${maxRetries} retries: Rate Limit Exceeded (429)`,
              );
            }
          } else if (retries < maxRetries) {
            // Other 4xx errors might be temporary, retry with backoff
            retries++;
            const delay = calculateBackoff(retries, retryDelay);
            logger.warn(
              `${response.status} Error. Retrying in ${Math.round(delay)}ms (${retries}/${maxRetries})`,
            );
            await sleep(delay);
            continue;
          } else {
            // Throw an error after max retries for other 4xx errors
            throw new Error(
              `Failed after ${maxRetries} retries: HTTP ${response.status} (${response.statusText})`,
            );
          }
        }

        const contentType = response.headers.get('content-type');
        const responseBody = contentType?.includes('application/json')
          ? await response.json()
          : await response.text();

        logger.debug('Response content-type:', contentType);

        return {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers),
          body: responseBody as ReturnType['body'],
          retries,
          slowModeEnabled,
        };
      } catch (error) {
        lastError = error as Error;
        logger.error(`Request failed: ${error}`);

        if (retries < maxRetries) {
          retries++;
          const delay = calculateBackoff(retries, retryDelay);
          logger.warn(
            `Network error. Retrying in ${Math.round(delay)}ms (${retries}/${maxRetries})`,
          );
          await sleep(delay);
        } else {
          throw new Error(
            `Failed after ${maxRetries} retries: ${lastError.message}`,
          );
        }
      }
    }

    // This should never be reached due to the throw above, but TypeScript needs it
    throw new Error(
      `Failed after ${maxRetries} retries: ${lastError?.message || 'Unknown error'}`,
    );
  },
  logParameters(params, { logger }) {
    const { method, url, params: queryParams, maxRetries, slowMode } = params;
    logger.log(
      `${method} ${url}${queryParams ? `?${new URLSearchParams(queryParams).toString()}` : ''}${
        maxRetries !== undefined ? ` (max retries: ${maxRetries})` : ''
      }${slowMode ? ' (slow mode)' : ''}`,
    );
  },

  logReturns: (result, { logger }) => {
    const { status, statusText, retries, slowModeEnabled } = result;
    logger.log(
      `${status} ${statusText}${retries ? ` after ${retries} retries` : ''}${slowModeEnabled ? ' (slow mode enabled)' : ''}`,
    );
  },
};

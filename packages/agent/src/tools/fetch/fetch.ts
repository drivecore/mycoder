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
});

const returnSchema = z
  .object({
    status: z.number(),
    statusText: z.string(),
    headers: z.record(z.string()),
    body: z.union([z.string(), z.record(z.any())]),
  })
  .describe('HTTP response including status, headers, and body');

type Parameters = z.infer<typeof parameterSchema>;
type ReturnType = z.infer<typeof returnSchema>;

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
    { method, url, params, body, headers }: Parameters,
    { logger },
  ): Promise<ReturnType> => {
    logger.verbose(`Starting ${method} request to ${url}`);
    const urlObj = new URL(url);

    // Add query parameters
    if (params) {
      logger.verbose('Adding query parameters:', params);
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

    logger.verbose('Request options:', options);
    const response = await fetch(urlObj.toString(), options);
    logger.verbose(
      `Request completed with status ${response.status} ${response.statusText}`,
    );

    const contentType = response.headers.get('content-type');
    const responseBody = contentType?.includes('application/json')
      ? await response.json()
      : await response.text();

    logger.verbose('Response content-type:', contentType);

    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers),
      body: responseBody as ReturnType['body'],
    };
  },
  logParameters(params, { logger }) {
    const { method, url, params: queryParams } = params;
    logger.info(
      `${method} ${url}${queryParams ? `?${new URLSearchParams(queryParams).toString()}` : ''}`,
    );
  },

  logReturns: (result, { logger }) => {
    const { status, statusText } = result;
    logger.info(`${status} ${statusText}`);
  },
};

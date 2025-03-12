/**
 * MCP Tool for MyCoder Agent
 *
 * This tool allows the agent to interact with Model Context Protocol (MCP) servers
 * to retrieve resources and use tools provided by those servers.
 *
 * Uses the official MCP SDK: https://www.npmjs.com/package/@modelcontextprotocol/sdk
 */

import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { McpConfig } from '../core/mcp/index.js';
import { Tool } from '../core/types.js';

// Parameters for listResources method
const listResourcesSchema = z.object({
  server: z
    .string()
    .optional()
    .describe('Optional server name to filter resources by'),
});

// Parameters for getResource method
const getResourceSchema = z.object({
  uri: z
    .string()
    .describe('URI of the resource to fetch in the format "scheme://path"'),
});

// Parameters for listTools method
const listToolsSchema = z.object({
  server: z
    .string()
    .optional()
    .describe('Optional server name to filter tools by'),
});

// Parameters for executeTool method
const executeToolSchema = z.object({
  uri: z
    .string()
    .describe('URI of the tool to execute in the format "scheme://path"'),
  params: z
    .record(z.unknown())
    .optional()
    .describe('Parameters to pass to the tool'),
});

// Return type for listResources
const listResourcesReturnSchema = z.array(
  z.object({
    uri: z.string(),
    metadata: z.record(z.unknown()).optional(),
  }),
);

// Return type for getResource
const getResourceReturnSchema = z.string();

// Return type for listTools
const listToolsReturnSchema = z.array(
  z.object({
    uri: z.string(),
    name: z.string(),
    description: z.string().optional(),
    parameters: z.record(z.unknown()).optional(),
    returns: z.record(z.unknown()).optional(),
  }),
);

// Return type for executeTool - can be any JSON value
const executeToolReturnSchema = z.unknown();

// Map to store MCP clients
const mcpClients = new Map<string, any>();

/**
 * Create a new MCP tool with the specified configuration
 * @param config MCP configuration
 * @returns The MCP tool
 */
export function createMcpTool(config: McpConfig): Tool {
  // We'll import the MCP SDK dynamically to avoid TypeScript errors
  // This is a temporary solution until we can properly add type declarations
  const mcpSdk = require('@modelcontextprotocol/sdk');

  // Initialize MCP clients for each configured server
  mcpClients.clear();

  if (config.servers && config.servers.length > 0) {
    for (const server of config.servers) {
      try {
        let clientOptions: any = {
          baseURL: server.url,
        };

        // Add authentication if configured
        if (server.auth && server.auth.type === 'bearer') {
          clientOptions = {
            ...clientOptions,
            headers: {
              Authorization: `Bearer ${server.auth.token}`,
            },
          };
        }

        const client = new mcpSdk.Client(clientOptions);
        mcpClients.set(server.name, client);
      } catch (error) {
        console.error(
          `Failed to initialize MCP client for server ${server.name}:`,
          error,
        );
      }
    }
  }

  // Define the MCP tool
  return {
    name: 'mcp',
    description:
      'Interact with Model Context Protocol (MCP) servers to retrieve resources and execute tools',
    parameters: z.discriminatedUnion('method', [
      z.object({
        method: z.literal('listResources'),
        params: listResourcesSchema.optional(),
      }),
      z.object({
        method: z.literal('getResource'),
        params: getResourceSchema,
      }),
      z.object({
        method: z.literal('listTools'),
        params: listToolsSchema.optional(),
      }),
      z.object({
        method: z.literal('executeTool'),
        params: executeToolSchema,
      }),
    ]),
    parametersJsonSchema: zodToJsonSchema(
      z.discriminatedUnion('method', [
        z.object({
          method: z.literal('listResources'),
          params: listResourcesSchema.optional(),
        }),
        z.object({
          method: z.literal('getResource'),
          params: getResourceSchema,
        }),
        z.object({
          method: z.literal('listTools'),
          params: listToolsSchema.optional(),
        }),
        z.object({
          method: z.literal('executeTool'),
          params: executeToolSchema,
        }),
      ]),
    ),
    returns: z.union([
      listResourcesReturnSchema,
      getResourceReturnSchema,
      listToolsReturnSchema,
      executeToolReturnSchema,
    ]),
    returnsJsonSchema: zodToJsonSchema(
      z.union([
        listResourcesReturnSchema,
        getResourceReturnSchema,
        listToolsReturnSchema,
        executeToolReturnSchema,
      ]),
    ),

    execute: async ({ method, params }, { logger }) => {
      // Extract the server name from a URI (resource or tool)
      function getServerNameFromUri(uri: string): string | undefined {
        const match = uri.match(/^([^:]+):\/\//);
        return match ? match[1] : undefined;
      }

      if (method === 'listResources') {
        // List available resources from MCP servers
        const resources: any[] = [];
        const serverFilter = params?.server;

        // If a specific server is requested, only check that server
        if (serverFilter) {
          const client = mcpClients.get(serverFilter);
          if (client) {
            try {
              logger.verbose(`Fetching resources from server: ${serverFilter}`);
              const serverResources = await client.resources();
              resources.push(...(serverResources as any[]));
            } catch (error) {
              logger.error(
                `Failed to fetch resources from server ${serverFilter}:`,
                error,
              );
            }
          } else {
            logger.warn(`Server not found: ${serverFilter}`);
          }
        } else {
          // Otherwise, check all servers
          for (const [serverName, client] of mcpClients.entries()) {
            try {
              logger.verbose(`Fetching resources from server: ${serverName}`);
              const serverResources = await client.resources();
              resources.push(...(serverResources as any[]));
            } catch (error) {
              logger.error(
                `Failed to fetch resources from server ${serverName}:`,
                error,
              );
            }
          }
        }

        return resources;
      } else if (method === 'getResource') {
        // Fetch a resource from an MCP server
        const uri = params.uri;

        // Parse the URI to determine which server to use
        const serverName = getServerNameFromUri(uri);
        if (!serverName) {
          throw new Error(`Could not determine server from URI: ${uri}`);
        }

        const client = mcpClients.get(serverName);
        if (!client) {
          throw new Error(`Server not found: ${serverName}`);
        }

        // Use the MCP SDK to fetch the resource
        logger.verbose(`Fetching resource: ${uri}`);
        const resource = await client.resource(uri);
        return resource.content;
      } else if (method === 'listTools') {
        // List available tools from MCP servers
        const tools: any[] = [];
        const serverFilter = params?.server;

        // If a specific server is requested, only check that server
        if (serverFilter) {
          const client = mcpClients.get(serverFilter);
          if (client) {
            try {
              logger.verbose(`Fetching tools from server: ${serverFilter}`);
              const serverTools = await client.tools();
              tools.push(...(serverTools as any[]));
            } catch (error) {
              logger.error(
                `Failed to fetch tools from server ${serverFilter}:`,
                error,
              );
            }
          } else {
            logger.warn(`Server not found: ${serverFilter}`);
          }
        } else {
          // Otherwise, check all servers
          for (const [serverName, client] of mcpClients.entries()) {
            try {
              logger.verbose(`Fetching tools from server: ${serverName}`);
              const serverTools = await client.tools();
              tools.push(...(serverTools as any[]));
            } catch (error) {
              logger.error(
                `Failed to fetch tools from server ${serverName}:`,
                error,
              );
            }
          }
        }

        return tools;
      } else if (method === 'executeTool') {
        // Execute a tool from an MCP server
        const { uri, params: toolParams = {} } = params;

        // Parse the URI to determine which server to use
        const serverName = getServerNameFromUri(uri);
        if (!serverName) {
          throw new Error(`Could not determine server from URI: ${uri}`);
        }

        const client = mcpClients.get(serverName);
        if (!client) {
          throw new Error(`Server not found: ${serverName}`);
        }

        // Use the MCP SDK to execute the tool
        logger.verbose(`Executing tool: ${uri} with params:`, toolParams);
        const result = await client.tool(uri, toolParams);
        return result;
      }

      throw new Error(`Unknown method: ${method}`);
    },

    logParameters: (params, { logger }) => {
      if (params.method === 'listResources') {
        logger.verbose(
          `Listing MCP resources${
            params.params?.server ? ` from server: ${params.params.server}` : ''
          }`,
        );
      } else if (params.method === 'getResource') {
        logger.verbose(`Fetching MCP resource: ${params.params.uri}`);
      } else if (params.method === 'listTools') {
        logger.verbose(
          `Listing MCP tools${
            params.params?.server ? ` from server: ${params.params.server}` : ''
          }`,
        );
      } else if (params.method === 'executeTool') {
        logger.verbose(`Executing MCP tool: ${params.params.uri}`);
      }
    },

    logReturns: (result, { logger }) => {
      if (Array.isArray(result)) {
        if (result.length > 0 && 'description' in result[0]) {
          logger.verbose(`Found ${result.length} MCP tools`);
        } else {
          logger.verbose(`Found ${result.length} MCP resources`);
        }
      } else if (typeof result === 'string') {
        logger.verbose(
          `Retrieved MCP resource content (${result.length} characters)`,
        );
      } else {
        logger.verbose(`Executed MCP tool and received result`);
      }
    },
  };
}

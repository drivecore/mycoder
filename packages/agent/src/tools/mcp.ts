/**
 * MCP Tool for MyCoder Agent
 * 
 * This tool allows the agent to interact with Model Context Protocol (MCP) servers
 * to retrieve resources and use tools provided by those servers.
 */

import { McpClient } from '../core/mcp/client';
import { McpConfig, McpResource } from '../core/mcp/types';
import { Tool } from './tool';
import { ToolContext } from './types';

/**
 * Parameters for listResources method
 */
interface ListResourcesParams {
  /** Optional server name to filter resources by */
  server?: string;
}

/**
 * Parameters for getResource method
 */
interface GetResourceParams {
  /** URI of the resource to fetch */
  uri: string;
}

/**
 * MCP Tool for interacting with MCP servers
 */
export class McpTool extends Tool {
  private client: McpClient;
  
  /**
   * Create a new MCP tool
   * @param config MCP configuration
   */
  constructor(private config: McpConfig = { servers: [], defaultResources: [] }) {
    super({
      name: 'mcp',
      description: 'Interact with Model Context Protocol (MCP) servers to retrieve resources',
      schema: {
        listResources: {
          description: 'List available resources from MCP servers',
          parameters: {
            server: {
              type: 'string',
              description: 'Optional server name to filter resources by',
              required: false,
            },
          },
        },
        getResource: {
          description: 'Fetch a resource from an MCP server',
          parameters: {
            uri: {
              type: 'string',
              description: 'URI of the resource to fetch in the format "scheme://path"',
              required: true,
            },
          },
        },
      },
    });
    
    // Initialize the MCP client with configured servers
    this.client = new McpClient(config.servers || []);
  }
  
  /**
   * List available resources from MCP servers
   * @param params Optional parameters
   * @param context Tool context
   * @returns List of available resources
   */
  async listResources(
    params: ListResourcesParams = {},
    _context: ToolContext,
  ): Promise<McpResource[]> {
    const resources = await this.client.getAvailableResources();
    
    // Filter by server if specified
    if (params.server) {
      return resources.filter(resource => {
        // Simple implementation - in a real implementation, this would be more sophisticated
        return resource.uri.startsWith(`${params.server}://`);
      });
    }
    
    return resources;
  }
  
  /**
   * Fetch a resource from an MCP server
   * @param params Parameters
   * @param context Tool context
   * @returns The resource content
   */
  async getResource(
    params: GetResourceParams,
    _context: ToolContext,
  ): Promise<string> {
    return await this.client.fetchResource(params.uri);
  }
}
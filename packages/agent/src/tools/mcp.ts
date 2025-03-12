/**
 * MCP Tool for MyCoder Agent
 * 
 * This tool allows the agent to interact with Model Context Protocol (MCP) servers
 * to retrieve resources and use tools provided by those servers.
 * 
 * Uses the official MCP SDK: https://www.npmjs.com/package/@modelcontextprotocol/sdk
 */

import { MCP, McpConfig, McpServerConfig } from '../core/mcp';
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
  private clients: Map<string, MCP.Client> = new Map();
  
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
    
    // Initialize MCP clients for each configured server
    this.initializeClients();
  }
  
  /**
   * Initialize MCP clients for each configured server
   */
  private initializeClients(): void {
    if (!this.config.servers || this.config.servers.length === 0) {
      return;
    }
    
    for (const server of this.config.servers) {
      try {
        const clientOptions: MCP.ClientOptions = {
          baseURL: server.url,
        };
        
        // Add authentication if configured
        if (server.auth && server.auth.type === 'bearer') {
          clientOptions.headers = {
            Authorization: `Bearer ${server.auth.token}`,
          };
        }
        
        const client = new MCP.Client(clientOptions);
        this.clients.set(server.name, client);
      } catch (error) {
        console.error(`Failed to initialize MCP client for server ${server.name}:`, error);
      }
    }
  }
  
  /**
   * List available resources from MCP servers
   * @param params Optional parameters
   * @param _context Tool context
   * @returns List of available resources
   */
  async listResources(
    params: ListResourcesParams = {},
    _context: ToolContext,
  ): Promise<MCP.Resource[]> {
    const resources: MCP.Resource[] = [];
    
    // If a specific server is requested, only check that server
    if (params.server) {
      const client = this.clients.get(params.server);
      if (client) {
        try {
          const serverResources = await client.resources();
          resources.push(...serverResources);
        } catch (error) {
          console.error(`Failed to fetch resources from server ${params.server}:`, error);
        }
      }
    } else {
      // Otherwise, check all servers
      for (const [serverName, client] of this.clients.entries()) {
        try {
          const serverResources = await client.resources();
          resources.push(...serverResources);
        } catch (error) {
          console.error(`Failed to fetch resources from server ${serverName}:`, error);
        }
      }
    }
    
    return resources;
  }
  
  /**
   * Fetch a resource from an MCP server
   * @param params Parameters
   * @param _context Tool context
   * @returns The resource content
   */
  async getResource(
    params: GetResourceParams,
    _context: ToolContext,
  ): Promise<string> {
    // Parse the URI to determine which server to use
    const serverName = this.getServerNameFromUri(params.uri);
    if (!serverName) {
      throw new Error(`Could not determine server from URI: ${params.uri}`);
    }
    
    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`Server not found: ${serverName}`);
    }
    
    // Use the MCP SDK to fetch the resource
    const resource = await client.resource(params.uri);
    return resource.content;
  }
  
  /**
   * Extract the server name from a resource URI
   * @param uri Resource URI in the format 'scheme://path'
   * @returns The server name or undefined if not found
   * @private
   */
  private getServerNameFromUri(uri: string): string | undefined {
    // For simplicity, we'll use the first part of the URI as the server name
    const match = uri.match(/^([^:]+):\/\//);
    return match ? match[1] : undefined;
  }
}
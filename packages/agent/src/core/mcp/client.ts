/**
 * Model Context Protocol (MCP) Client
 * 
 * This module implements a client for the Model Context Protocol (MCP), which allows
 * applications to provide standardized context to Large Language Models (LLMs).
 */

import fetch from 'node-fetch';

/**
 * Configuration for an MCP server
 */
export interface McpServerConfig {
  /** Unique name for this MCP server */
  name: string;
  /** URL of the MCP server */
  url: string;
  /** Optional authentication configuration */
  auth?: {
    /** Authentication type (currently only 'bearer' is supported) */
    type: 'bearer';
    /** Authentication token */
    token: string;
  };
}

/**
 * MCP Resource descriptor
 */
export interface McpResource {
  /** Resource URI in the format 'scheme://path' */
  uri: string;
  /** Optional metadata about the resource */
  metadata?: Record<string, unknown>;
}

/**
 * MCP Client class for interacting with MCP servers
 */
export class McpClient {
  private servers: Map<string, McpServerConfig> = new Map();
  
  /**
   * Create a new MCP client
   * @param servers Optional array of server configurations to add
   */
  constructor(servers: McpServerConfig[] = []) {
    servers.forEach(server => this.addServer(server));
  }

  /**
   * Add an MCP server to the client
   * @param server Server configuration
   */
  addServer(server: McpServerConfig): void {
    this.servers.set(server.name, server);
  }

  /**
   * Remove an MCP server from the client
   * @param name Name of the server to remove
   */
  removeServer(name: string): void {
    this.servers.delete(name);
  }

  /**
   * Get all configured servers
   * @returns Array of server configurations
   */
  getServers(): McpServerConfig[] {
    return Array.from(this.servers.values());
  }

  /**
   * Fetch a resource from an MCP server
   * @param uri Resource URI in the format 'scheme://path'
   * @returns The resource content as a string
   */
  async fetchResource(uri: string): Promise<string> {
    // Parse the URI to determine which server to use
    const serverName = this.getServerNameFromUri(uri);
    if (!serverName) {
      throw new Error(`Could not determine server from URI: ${uri}`);
    }

    const server = this.servers.get(serverName);
    if (!server) {
      throw new Error(`Server not found: ${serverName}`);
    }

    // Extract the path from the URI
    const path = this.getPathFromUri(uri);
    
    // Construct the full URL
    const url = new URL(path, server.url);
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };
    
    // Add authentication if configured
    if (server.auth) {
      if (server.auth.type === 'bearer') {
        headers['Authorization'] = `Bearer ${server.auth.token}`;
      }
    }
    
    // Make the request
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
    }
    
    return await response.text();
  }

  /**
   * Get available resources from all configured servers
   * @returns Array of available resources
   */
  async getAvailableResources(): Promise<McpResource[]> {
    const resources: McpResource[] = [];
    
    for (const server of this.servers.values()) {
      try {
        // Fetch resources from this server
        const url = new URL('/.well-known/mcp/resources', server.url);
        
        // Prepare headers
        const headers: Record<string, string> = {
          'Accept': 'application/json',
        };
        
        // Add authentication if configured
        if (server.auth) {
          if (server.auth.type === 'bearer') {
            headers['Authorization'] = `Bearer ${server.auth.token}`;
          }
        }
        
        // Make the request
        const response = await fetch(url.toString(), {
          method: 'GET',
          headers,
        });
        
        if (response.ok) {
          const data = await response.json() as { resources: McpResource[] };
          resources.push(...data.resources);
        }
      } catch (error) {
        console.error(`Failed to fetch resources from server ${server.name}:`, error);
      }
    }
    
    return resources;
  }
  
  /**
   * Extract the server name from a resource URI
   * @param uri Resource URI in the format 'scheme://path'
   * @returns The server name or undefined if not found
   * @private
   */
  private getServerNameFromUri(uri: string): string | undefined {
    // For simplicity, we'll use the first part of the URI as the server name
    // In a real implementation, this would be more sophisticated
    const match = uri.match(/^([^:]+):\/\//);
    return match ? match[1] : undefined;
  }
  
  /**
   * Extract the path from a resource URI
   * @param uri Resource URI in the format 'scheme://path'
   * @returns The path part of the URI
   * @private
   */
  private getPathFromUri(uri: string): string {
    // Remove the scheme:// part
    return uri.replace(/^[^:]+:\/\//, '');
  }
}
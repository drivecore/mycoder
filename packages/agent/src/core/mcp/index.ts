/**
 * Model Context Protocol (MCP) Integration
 * 
 * This module provides integration with the Model Context Protocol (MCP),
 * allowing MyCoder to use context from MCP-compatible servers.
 * 
 * Uses the official MCP SDK: https://www.npmjs.com/package/@modelcontextprotocol/sdk
 */

/**
 * Configuration for MCP in mycoder.config.js
 */
export interface McpConfig {
  /** Array of MCP server configurations */
  servers?: McpServerConfig[];
  /** Default resources to load automatically */
  defaultResources?: string[];
}

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
/**
 * Type definitions for MCP integration
 */

/**
 * MCP configuration in mycoder.config.js
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
 * MCP Tool descriptor
 */
export interface McpTool {
  /** Tool ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what the tool does */
  description: string;
  /** Server that provides this tool */
  server: string;
  /** Tool parameters schema */
  parameters?: Record<string, unknown>;
}
---
sidebar_position: 5
---

# Model Context Protocol (MCP)

MyCoder includes support for the [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction), which enables AI assistants to access external context sources and tools during conversations. This page explains how to configure and use MCP with MyCoder.

## What is the Model Context Protocol?

The Model Context Protocol (MCP) is an open standard that allows AI assistants to dynamically access external resources and tools. By integrating MCP, MyCoder can:

- Access documentation, knowledge bases, and other context sources
- Retrieve up-to-date information from external systems
- Use specialized tools and services provided by MCP servers

MCP provides a standardized way for AI assistants to interact with external systems, making it easier to extend their capabilities without modifying the core system.

## How MyCoder Implements MCP

MyCoder uses the official [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) package to integrate with MCP-compatible servers. The implementation provides:

1. A configuration system to specify MCP servers and default resources
2. A tool that allows the agent to list and retrieve resources from MCP servers
3. Automatic handling of authentication with MCP servers
4. Support for multiple MCP servers simultaneously
5. Robust error handling for connection and resource issues

The MCP implementation in MyCoder is focused primarily on the Resource aspect of MCP, allowing the agent to retrieve context from MCP servers. The protocol itself also defines Tools (similar to POST endpoints) and Prompts (reusable templates), which may be supported in future versions.

## Configuring MCP

To use MCP with MyCoder, you need to configure one or more MCP servers in your `mycoder.config.js` file:

```javascript
// mycoder.config.js
export default {
  // Other configuration options...

  // MCP configuration
  mcp: {
    // MCP Servers to connect to
    servers: [
      {
        name: 'company-docs',
        url: 'https://mcp.example.com/docs',
        // Optional authentication
        auth: {
          type: 'bearer',
          token: process.env.MCP_SERVER_TOKEN,
        },
      },
    ],

    // Optional: Default context resources to load
    defaultResources: ['company-docs://api/reference'],
  },
};
```

### Configuration Options

The MCP configuration accepts the following options:

| Option | Description | Type | Default |
|--------|-------------|------|---------|
| `servers` | Array of MCP server configurations | Array | `[]` |
| `defaultResources` | Resources to load automatically | Array of strings | `[]` |

Each server configuration requires:

| Option | Description | Type | Required |
|--------|-------------|------|----------|
| `name` | Unique name for this MCP server | String | Yes |
| `url` | URL of the MCP server | String | Yes |
| `auth` | Authentication configuration | Object | No |

Authentication options:

| Option | Description | Type | Required |
|--------|-------------|------|----------|
| `type` | Authentication type (currently only 'bearer') | String | Yes |
| `token` | Authentication token | String | Yes |

## Using MCP in MyCoder

When MCP is configured, the agent automatically has access to a new `mcp` tool that allows it to:

1. List available resources from configured MCP servers
2. Fetch resources to use as context for its work

### Example: Listing Available Resources

The agent can list all available resources from configured MCP servers:

```
I'll check what resources are available from the MCP servers.

<function_calls>
<invoke name="mcp">
<parameter name="method">listResources
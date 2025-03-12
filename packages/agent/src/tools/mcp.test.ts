import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { McpConfig } from '../core/mcp/index.js';
import { ToolContext } from '../core/types.js';

import { createMcpTool } from './mcp.js';

// Mock the require function to mock the MCP SDK
vi.mock('@modelcontextprotocol/sdk', () => {
  return {
    default: {
      Client: vi.fn().mockImplementation(() => ({
        resources: vi.fn().mockResolvedValue([
          { uri: 'test://resource1', metadata: { title: 'Resource 1' } },
          { uri: 'test://resource2', metadata: { title: 'Resource 2' } },
        ]),
        resource: vi.fn().mockImplementation((uri) => {
          if (uri === 'test://resource1') {
            return Promise.resolve({ content: 'Resource 1 content' });
          } else if (uri === 'test://resource2') {
            return Promise.resolve({ content: 'Resource 2 content' });
          }
          return Promise.reject(new Error(`Resource not found: ${uri}`));
        }),
        tools: vi.fn().mockResolvedValue([
          {
            uri: 'test://tool1',
            name: 'Tool 1',
            description: 'Test tool 1',
            parameters: { param1: { type: 'string' } },
            returns: { type: 'string' },
          },
          {
            uri: 'test://tool2',
            name: 'Tool 2',
            description: 'Test tool 2',
            parameters: { param1: { type: 'number' } },
            returns: { type: 'object' },
          },
        ]),
        tool: vi.fn().mockImplementation((uri, params) => {
          if (uri === 'test://tool1') {
            return Promise.resolve(
              `Tool 1 executed with params: ${JSON.stringify(params)}`,
            );
          } else if (uri === 'test://tool2') {
            return Promise.resolve({
              result: `Tool 2 executed with params: ${JSON.stringify(params)}`,
            });
          }
          return Promise.reject(new Error(`Tool not found: ${uri}`));
        }),
      })),
    },
    Client: vi.fn().mockImplementation(() => ({
      resources: vi.fn().mockResolvedValue([
        { uri: 'test://resource1', metadata: { title: 'Resource 1' } },
        { uri: 'test://resource2', metadata: { title: 'Resource 2' } },
      ]),
      resource: vi.fn().mockImplementation((uri) => {
        if (uri === 'test://resource1') {
          return Promise.resolve({ content: 'Resource 1 content' });
        } else if (uri === 'test://resource2') {
          return Promise.resolve({ content: 'Resource 2 content' });
        }
        return Promise.reject(new Error(`Resource not found: ${uri}`));
      }),
      tools: vi.fn().mockResolvedValue([
        {
          uri: 'test://tool1',
          name: 'Tool 1',
          description: 'Test tool 1',
          parameters: { param1: { type: 'string' } },
          returns: { type: 'string' },
        },
        {
          uri: 'test://tool2',
          name: 'Tool 2',
          description: 'Test tool 2',
          parameters: { param1: { type: 'number' } },
          returns: { type: 'object' },
        },
      ]),
      tool: vi.fn().mockImplementation((uri, params) => {
        if (uri === 'test://tool1') {
          return Promise.resolve(
            `Tool 1 executed with params: ${JSON.stringify(params)}`,
          );
        } else if (uri === 'test://tool2') {
          return Promise.resolve({
            result: `Tool 2 executed with params: ${JSON.stringify(params)}`,
          });
        }
        return Promise.reject(new Error(`Tool not found: ${uri}`));
      }),
    })),
  };
});

// Create a mock logger
const mockLogger = {
  verbose: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
  log: vi.fn(),
};

// Create a mock TokenTracker
const mockTokenTracker = {
  tokenUsage: {
    input: 0,
    output: 0,
    cacheReads: 0,
    cacheWrites: 0,
    clone: vi.fn().mockReturnThis(),
    add: vi.fn(),
    getCost: vi.fn().mockReturnValue('$0.00'),
    toString: vi
      .fn()
      .mockReturnValue(
        'input: 0 cache-writes: 0 cache-reads: 0 output: 0 COST: $0.00',
      ),
  },
  children: [],
  name: 'test',
  getTotalUsage: vi.fn().mockReturnValue({
    input: 0,
    output: 0,
    cacheReads: 0,
    cacheWrites: 0,
    clone: vi.fn().mockReturnThis(),
    add: vi.fn(),
    getCost: vi.fn().mockReturnValue('$0.00'),
    toString: vi.fn(),
  }),
  getTotalCost: vi.fn().mockReturnValue('$0.00'),
  toString: vi
    .fn()
    .mockReturnValue(
      'test: input: 0 cache-writes: 0 cache-reads: 0 output: 0 COST: $0.00',
    ),
};

// Create a mock BackgroundTools
const mockBackgroundTools = {
  tools: new Map(),
  ownerName: 'test',
  registerShell: vi.fn().mockReturnValue('shell-id'),
  registerBrowser: vi.fn().mockReturnValue('browser-id'),
  registerAgent: vi.fn().mockReturnValue('agent-id'),
  updateToolStatus: vi.fn().mockReturnValue(true),
  getTools: vi.fn().mockReturnValue([]),
  getToolById: vi.fn().mockReturnValue(undefined),
  cleanup: vi.fn().mockResolvedValue(undefined),
};

// Create a mock ToolContext
const mockToolContext: ToolContext = {
  logger: mockLogger as any,
  workingDirectory: '/test',
  headless: true,
  userSession: false,
  pageFilter: 'none',
  tokenTracker: mockTokenTracker as any,
  githubMode: false,
  provider: 'anthropic',
  model: 'claude-3',
  maxTokens: 4096,
  temperature: 0.7,
  backgroundTools: mockBackgroundTools as any,
};

describe('MCP Tool', () => {
  let mcpTool: ReturnType<typeof createMcpTool>;
  const testConfig: McpConfig = {
    servers: [
      {
        name: 'test',
        url: 'https://test.example.com',
        auth: {
          type: 'bearer',
          token: 'test-token',
        },
      },
    ],
  };

  beforeEach(() => {
    mcpTool = createMcpTool(testConfig);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should list resources from MCP servers', async () => {
    const result = await mcpTool.execute(
      { method: 'listResources', params: { server: 'test' } },
      mockToolContext,
    );

    expect(result).toHaveLength(2);
    expect(result[0].uri).toBe('test://resource1');
    expect(result[1].uri).toBe('test://resource2');
    expect(mockLogger.verbose).toHaveBeenCalledWith(
      'Fetching resources from server: test',
    );
  });

  it('should get a resource from an MCP server', async () => {
    const result = await mcpTool.execute(
      { method: 'getResource', params: { uri: 'test://resource1' } },
      mockToolContext,
    );

    expect(result).toBe('Resource 1 content');
    expect(mockLogger.verbose).toHaveBeenCalledWith(
      'Fetching resource: test://resource1',
    );
  });

  it('should list tools from MCP servers', async () => {
    const result = await mcpTool.execute(
      { method: 'listTools', params: { server: 'test' } },
      mockToolContext,
    );

    expect(result).toHaveLength(2);
    expect(result[0].uri).toBe('test://tool1');
    expect(result[0].name).toBe('Tool 1');
    expect(result[1].uri).toBe('test://tool2');
    expect(result[1].name).toBe('Tool 2');
    expect(mockLogger.verbose).toHaveBeenCalledWith(
      'Fetching tools from server: test',
    );
  });

  it('should execute a tool from an MCP server', async () => {
    const result = await mcpTool.execute(
      {
        method: 'executeTool',
        params: { uri: 'test://tool1', params: { param1: 'test' } },
      },
      mockToolContext,
    );

    expect(result).toBe('Tool 1 executed with params: {"param1":"test"}');
    expect(mockLogger.verbose).toHaveBeenCalledWith(
      'Executing tool: test://tool1 with params:',
      { param1: 'test' },
    );
  });

  it('should execute a tool that returns an object', async () => {
    const result = await mcpTool.execute(
      {
        method: 'executeTool',
        params: { uri: 'test://tool2', params: { param1: 42 } },
      },
      mockToolContext,
    );

    expect(result).toEqual({
      result: 'Tool 2 executed with params: {"param1":42}',
    });
  });

  it('should throw an error for unknown methods', async () => {
    await expect(
      mcpTool.execute(
        { method: 'unknownMethod' as any, params: {} },
        mockToolContext,
      ),
    ).rejects.toThrow('Unknown method: unknownMethod');
  });

  it('should throw an error for invalid URIs', async () => {
    await expect(
      mcpTool.execute(
        { method: 'getResource', params: { uri: 'invalid-uri' } },
        mockToolContext,
      ),
    ).rejects.toThrow('Could not determine server from URI: invalid-uri');
  });

  it('should throw an error for unknown servers', async () => {
    await expect(
      mcpTool.execute(
        { method: 'getResource', params: { uri: 'unknown://resource' } },
        mockToolContext,
      ),
    ).rejects.toThrow('Server not found: unknown');
  });
});

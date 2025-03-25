import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { ToolContext } from '../../core/types.js';
import { Logger } from '../../utils/logger.js';

import { fetchTool } from './fetch.js';

// Mock setTimeout to resolve immediately for all sleep calls
vi.mock('node:timers', () => ({
  setTimeout: (callback: () => void) => {
    callback();
    return { unref: vi.fn() };
  },
}));

describe('fetchTool', () => {
  // Create a mock logger
  const mockLogger = {
    debug: vi.fn(),
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    prefix: '',
    logLevel: 'debug',
    logLevelIndex: 0,
    name: 'test-logger',
    child: vi.fn(),
    withPrefix: vi.fn(),
    setLevel: vi.fn(),
    nesting: 0,
    listeners: [],
    emitMessages: vi.fn(),
  } as unknown as Logger;

  // Create a mock ToolContext
  const mockContext = {
    logger: mockLogger,
    workingDirectory: '/test',
    headless: true,
    userSession: false, // Use boolean as required by type
    tokenTracker: { remaining: 1000, used: 0, total: 1000 },
    abortSignal: new AbortController().signal,
    shellManager: {} as any,
    sessionManager: {} as any,
    agentManager: {} as any,
    history: [],
    statusUpdate: vi.fn(),
    captureOutput: vi.fn(),
    isSubAgent: false,
    parentAgentId: null,
    subAgentMode: 'disabled',
  } as unknown as ToolContext;

  // Mock global fetch
  let originalFetch: typeof global.fetch;
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    originalFetch = global.fetch;
    mockFetch = vi.fn();
    global.fetch = mockFetch as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should make a successful request', async () => {
    const mockResponse = {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: 'test' }),
      text: async () => 'test',
      ok: true,
    };
    mockFetch.mockResolvedValueOnce(mockResponse);

    const result = await fetchTool.execute(
      { method: 'GET', url: 'https://example.com' },
      mockContext,
    );

    expect(result).toEqual({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: { data: 'test' },
      retries: 0,
      slowModeEnabled: false,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('should retry on 400 Bad Request error', async () => {
    const mockErrorResponse = {
      status: 400,
      statusText: 'Bad Request',
      headers: new Headers({}),
      text: async () => 'Bad Request',
      ok: false,
    };

    const mockSuccessResponse = {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: 'success' }),
      text: async () => 'success',
      ok: true,
    };

    // First request fails, second succeeds
    mockFetch.mockResolvedValueOnce(mockErrorResponse);
    mockFetch.mockResolvedValueOnce(mockSuccessResponse);

    const result = await fetchTool.execute(
      {
        method: 'GET',
        url: 'https://example.com',
        maxRetries: 2,
        retryDelay: 100,
      },
      mockContext,
    );

    expect(result).toEqual({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: { data: 'success' },
      retries: 1,
      slowModeEnabled: false,
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('400 Bad Request Error'),
    );
  });

  it('should implement exponential backoff for 429 Rate Limit errors', async () => {
    const mockRateLimitResponse = {
      status: 429,
      statusText: 'Too Many Requests',
      headers: new Headers({ 'retry-after': '2' }), // 2 seconds
      text: async () => 'Rate Limit Exceeded',
      ok: false,
    };

    const mockSuccessResponse = {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: 'success after rate limit' }),
      text: async () => 'success',
      ok: true,
    };

    mockFetch.mockResolvedValueOnce(mockRateLimitResponse);
    mockFetch.mockResolvedValueOnce(mockSuccessResponse);

    const result = await fetchTool.execute(
      {
        method: 'GET',
        url: 'https://example.com',
        maxRetries: 2,
        retryDelay: 100,
      },
      mockContext,
    );

    expect(result).toEqual({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      body: { data: 'success after rate limit' },
      retries: 1,
      slowModeEnabled: true, // Slow mode should be enabled after a rate limit error
    });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      expect.stringContaining('429 Rate Limit Exceeded'),
    );
  });

  it('should throw an error after maximum retries', async () => {
    const mockErrorResponse = {
      status: 400,
      statusText: 'Bad Request',
      headers: new Headers({}),
      text: async () => 'Bad Request',
      ok: false,
    };

    // All requests fail
    mockFetch.mockResolvedValue(mockErrorResponse);

    await expect(
      fetchTool.execute(
        {
          method: 'GET',
          url: 'https://example.com',
          maxRetries: 2,
          retryDelay: 100,
        },
        mockContext,
      ),
    ).rejects.toThrow('Failed after 2 retries');

    expect(mockFetch).toHaveBeenCalledTimes(3); // Initial + 2 retries
    expect(mockLogger.warn).toHaveBeenCalledTimes(2); // Two retry warnings
  });

  it('should respect retry-after header with timestamp', async () => {
    const futureDate = new Date(Date.now() + 3000).toUTCString();
    const mockRateLimitResponse = {
      status: 429,
      statusText: 'Too Many Requests',
      headers: new Headers({ 'retry-after': futureDate }),
      text: async () => 'Rate Limit Exceeded',
      ok: false,
    };

    const mockSuccessResponse = {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: 'success' }),
      text: async () => 'success',
      ok: true,
    };

    mockFetch.mockResolvedValueOnce(mockRateLimitResponse);
    mockFetch.mockResolvedValueOnce(mockSuccessResponse);

    const result = await fetchTool.execute(
      {
        method: 'GET',
        url: 'https://example.com',
        maxRetries: 2,
        retryDelay: 100,
      },
      mockContext,
    );

    expect(result.status).toBe(200);
    expect(result.slowModeEnabled).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('should handle network errors with retries', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    mockFetch.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: 'success after network error' }),
      text: async () => 'success',
      ok: true,
    });

    const result = await fetchTool.execute(
      {
        method: 'GET',
        url: 'https://example.com',
        maxRetries: 2,
        retryDelay: 100,
      },
      mockContext,
    );

    expect(result.status).toBe(200);
    expect(result.retries).toBe(1);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockLogger.error).toHaveBeenCalledWith(
      expect.stringContaining('Request failed'),
    );
  });

  it('should use slow mode when explicitly enabled', async () => {
    // First request succeeds
    mockFetch.mockResolvedValueOnce({
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ data: 'success in slow mode' }),
      text: async () => 'success',
      ok: true,
    });

    const result = await fetchTool.execute(
      { method: 'GET', url: 'https://example.com', slowMode: true },
      mockContext,
    );

    expect(result.status).toBe(200);
    expect(result.slowModeEnabled).toBe(true);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

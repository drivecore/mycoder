import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Page } from 'playwright';
import { filterPageContent } from './filterPageContent';
import { ToolContext } from '../../../core/types';

// HTML content to use in tests
const HTML_CONTENT = '<html><body><h1>Test Content</h1></body></html>';
const MARKDOWN_CONTENT = '# Test Content\n\nThis is the extracted content from the page.';

// Mock the Page object
const mockPage = {
  content: vi.fn().mockResolvedValue(HTML_CONTENT),
  url: vi.fn().mockReturnValue('https://example.com'),
  evaluate: vi.fn(),
} as unknown as Page;

// Mock fetch for LLM calls
global.fetch = vi.fn();

describe('filterPageContent', () => {
  let mockContext: ToolContext;

  beforeEach(() => {
    mockContext = {
      logger: {
        debug: vi.fn(),
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
      },
      provider: 'openai',
      model: 'gpt-4',
      apiKey: 'test-api-key',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      maxTokens: 4000,
      temperature: 0.3,
    } as unknown as ToolContext;

    // Reset mocks
    vi.resetAllMocks();
    
    // Mock the content method to return the HTML_CONTENT
    mockPage.content.mockResolvedValue(HTML_CONTENT);
    
    // Mock fetch to return a successful response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: MARKDOWN_CONTENT,
            },
          },
        ],
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return raw DOM content with raw filter', async () => {
    const result = await filterPageContent(mockPage, 'raw', mockContext);
    
    expect(mockPage.content).toHaveBeenCalled();
    expect(result).toEqual(HTML_CONTENT);
  });

  it('should use LLM to extract content with smartMarkdown filter', async () => {
    const result = await filterPageContent(mockPage, 'smartMarkdown', mockContext);
    
    expect(mockPage.content).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key',
        }),
        body: expect.any(String),
      })
    );
    
    // Verify the result is the markdown content from the LLM
    expect(result).toEqual(MARKDOWN_CONTENT);
  });

  it('should fall back to raw DOM if LLM call fails', async () => {
    // Mock fetch to return an error
    (global.fetch as any).mockResolvedValue({
      ok: false,
      text: async () => 'API Error',
    });

    const result = await filterPageContent(mockPage, 'smartMarkdown', mockContext);
    
    expect(mockPage.content).toHaveBeenCalled();
    expect(mockContext.logger.error).toHaveBeenCalled();
    expect(result).toEqual(HTML_CONTENT);
  });

  it('should fall back to raw DOM if context is not provided for smartMarkdown', async () => {
    // Create a minimal mock context with just a logger to prevent errors
    const minimalContext = {
      logger: {
        debug: vi.fn(),
        log: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
      }
    } as unknown as ToolContext;
    
    const result = await filterPageContent(mockPage, 'smartMarkdown', minimalContext);
    
    expect(mockPage.content).toHaveBeenCalled();
    expect(minimalContext.logger.warn).toHaveBeenCalled();
    expect(result).toEqual(HTML_CONTENT);
  });
});
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { Page } from 'playwright';
import { ToolContext } from '../../../core/types.js';

const OUTPUT_LIMIT = 11 * 1024; // 10KB limit

/**
 * Returns the raw HTML content of the page without any processing
 */
async function getRawDOM(page: Page): Promise<string> {
  const content = await page.content();
  return content;
}

/**
 * Uses an LLM to extract the main content from a page and format it as markdown
 */
async function getSmartMarkdownContent(page: Page, context: ToolContext): Promise<string> {
  try {
    const html = await page.content();
    const url = page.url();
    
    // Create a system prompt for the LLM
    const systemPrompt = `You are an expert at extracting the main content from web pages.
Given the HTML content of a webpage, extract only the main informative content.
Format the extracted content as clean, well-structured markdown.
Ignore headers, footers, navigation, sidebars, ads, and other non-content elements.
Preserve the important headings, paragraphs, lists, and other content structures.
Do not include any explanations or descriptions about what you're doing.
Just return the extracted content as markdown.`;

    // Use the configured LLM to extract the content
    const { provider, model, apiKey, baseUrl } = context;
    
    if (!provider || !model) {
      context.logger.warn('LLM provider or model not available, falling back to raw DOM');
      return getRawDOM(page);
    }

    try {
      // Import the createProvider function from the provider module
      const { createProvider } = await import('../../../core/llm/provider.js');
      
      // Create a provider instance using the provider abstraction
      const llmProvider = createProvider(provider, model, {
        apiKey,
        baseUrl
      });
      
      // Generate text using the provider
      const response = await llmProvider.generateText({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `URL: ${url}\n\nHTML content:\n${html}`
          }
        ],
        temperature: 0.3,
        maxTokens: 4000
      });
      
      // Extract the markdown content from the response
      const markdown = response.text;
      
      if (!markdown) {
        context.logger.warn('LLM returned empty content, falling back to raw DOM');
        return getRawDOM(page);
      }
      
      // Log token usage for monitoring
      context.logger.debug(`Token usage for content extraction: ${JSON.stringify(response.tokenUsage)}`);
      
      return markdown;
    } catch (llmError) {
      context.logger.error('Error using LLM provider for content extraction:', llmError);
      return getRawDOM(page);
    }
  } catch (error) {
    context.logger.error('Error using LLM for content extraction:', error);
    // Fallback to raw mode if LLM processing fails
    return getRawDOM(page);
  }
}

/**
 * Gets the rendered DOM of a page with specified processing method
 */
export async function filterPageContent(
  page: Page,
  pageFilter: 'raw' | 'smartMarkdown',
  context?: ToolContext
): Promise<string> {
  let result: string = '';
  
  switch (pageFilter) {
    case 'smartMarkdown':
      if (!context) {
        console.warn('ToolContext required for smartMarkdown filter but not provided, falling back to raw mode');
        result = await getRawDOM(page);
      } else {
        result = await getSmartMarkdownContent(page, context);
      }
      break;
    case 'raw':
    default:
      result = await getRawDOM(page);
      break;
  }

  // Ensure result is a string before checking length
  const resultString = result || '';
  if (resultString.length > OUTPUT_LIMIT) {
    return resultString.slice(0, OUTPUT_LIMIT) + '...(truncated)';
  }
  return resultString;
}

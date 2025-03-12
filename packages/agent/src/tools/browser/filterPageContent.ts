import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { Page } from 'playwright';

const OUTPUT_LIMIT = 11 * 1024; // 10KB limit

/**
 * Returns the raw HTML content of the page without any processing
 */
async function getNoneProcessedDOM(page: Page): Promise<string> {
  return await page.content();
}

/**
 * Processes the page using Mozilla's Readability to extract the main content
 * Falls back to simple processing if Readability fails
 */
async function getReadabilityProcessedDOM(page: Page): Promise<string> {
  try {
    const html = await page.content();
    const url = page.url();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      console.warn(
        'Readability could not parse the page, falling back to simple mode',
      );
      return getSimpleProcessedDOM(page);
    }

    // Return a formatted version of the article
    return JSON.stringify(
      {
        url: url,
        title: article.title || '',
        content: article.content || '',
        textContent: article.textContent || '',
        excerpt: article.excerpt || '',
        byline: article.byline || '',
        dir: article.dir || '',
        siteName: article.siteName || '',
        length: article.length || 0,
      },
      null,
      2,
    );
  } catch (error) {
    console.error('Error using Readability:', error);
    // Fallback to simple mode if Readability fails
    return getSimpleProcessedDOM(page);
  }
}

/**
 * Processes the page by removing invisible elements and non-visual tags
 */
async function getSimpleProcessedDOM(page: Page): Promise<string> {
  const domContent = await page.evaluate(() => {
    const clone = document.documentElement;

    const elements = clone.querySelectorAll('*');

    const elementsToRemove: Element[] = [];
    elements.forEach((element) => {
      const computedStyle = window.getComputedStyle(element);
      const isVisible =
        computedStyle.display !== 'none' &&
        computedStyle.visibility !== 'hidden' &&
        computedStyle.opacity !== '0';

      if (!isVisible) {
        elementsToRemove.push(element);
      }
    });

    const nonVisualTags = clone.querySelectorAll(
      'noscript, iframe, link[rel="stylesheet"], meta, svg, img, symbol, path, style, script',
    );
    nonVisualTags.forEach((element) => elementsToRemove.push(element));

    elementsToRemove.forEach((element) => element.remove());

    return clone.outerHTML;
  });

  return domContent.replace(/\n/g, '').replace(/\s+/g, ' ');
}

/**
 * Gets the rendered DOM of a page with specified processing method
 */
export async function filterPageContent(
  page: Page,
  pageFilter: 'simple' | 'none' | 'readability',
): Promise<string> {
  let result: string = '';
  switch (pageFilter) {
    case 'none':
      result = await getNoneProcessedDOM(page);
      break;
    case 'readability':
      result = await getReadabilityProcessedDOM(page);
      break;
    case 'simple':
    default:
      result = await getSimpleProcessedDOM(page);
      break;
  }

  if (result.length > OUTPUT_LIMIT) {
    return result.slice(0, OUTPUT_LIMIT) + '...(truncated)';
  }
  return result;
}

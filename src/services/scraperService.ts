import axios from 'axios';

export interface ScrapedArticle {
  title: string;
  content: string;
  url: string;
  extractedAt: number;
  metadata?: {
    author?: string;
    publishDate?: string;
    source?: string;
    description?: string;
  };
}

export interface ScraperResponse {
  success: boolean;
  data?: ScrapedArticle;
  error?: string;
}

const FIRECRAWL_API_KEY = import.meta.env.VITE_FIRECRAWL_API_KEY;
const FIRECRAWL_API_URL = 'https://api.firecrawl.dev/v1';

/**
 * Validates if a URL is valid and accessible
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Scrapes an article from a given URL using Firecrawl API
 * Extracts title, content, metadata, and structured data
 */
export async function scrapeArticle(url: string): Promise<ScraperResponse> {
  try {
    // Validate URL
    if (!isValidUrl(url)) {
      return {
        success: false,
        error: 'Invalid URL format. Please provide a valid HTTP or HTTPS URL.'
      };
    }

    if (!FIRECRAWL_API_KEY) {
      return {
        success: false,
        error: 'Firecrawl API key is not configured. Please add VITE_FIRECRAWL_API_KEY to your environment.'
      };
    }

    console.log(`[v0] Scraping article from: ${url}`);

    // Call Firecrawl API with markdown extraction
    const response = await axios.post(
      `${FIRECRAWL_API_URL}/scrape`,
      {
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        timeout: 30000
      },
      {
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 35000
      }
    );

    if (!response.data || !response.data.success) {
      return {
        success: false,
        error: 'Failed to scrape the article. Please check the URL and try again.'
      };
    }

    const data = response.data.data;
    
    // Extract title from the content or metadata
    let title = data.metadata?.title || data.title || 'Untitled Article';
    
    // Get content from markdown or HTML
    const content = data.markdown || data.html || data.content || '';
    
    if (!content) {
      return {
        success: false,
        error: 'Could not extract content from the article. The page may not have readable content.'
      };
    }

    // Extract metadata
    const metadata = {
      author: data.metadata?.author || undefined,
      publishDate: data.metadata?.publishedDate || data.metadata?.date || undefined,
      source: data.metadata?.source || new URL(url).hostname || undefined,
      description: data.metadata?.description || undefined
    };

    // Remove undefined values from metadata
    Object.keys(metadata).forEach(key => 
      (metadata as any)[key] === undefined && delete (metadata as any)[key]
    );

    const scrapedArticle: ScrapedArticle = {
      title: title.substring(0, 500), // Limit title length
      content: content.substring(0, 50000), // Limit content length to stay under token limits
      url: url,
      extractedAt: Date.now(),
      metadata: metadata
    };

    console.log(`[v0] Successfully scraped article: "${title}" (${content.length} chars)`);

    return {
      success: true,
      data: scrapedArticle
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('[v0] Scraper error:', errorMessage);

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Firecrawl API authentication failed. Please check your API key.'
        };
      }
      if (error.response?.status === 429) {
        return {
          success: false,
          error: 'Rate limit exceeded. Please wait a moment and try again.'
        };
      }
      if (error.code === 'ECONNABORTED') {
        return {
          success: false,
          error: 'Request timeout. The page took too long to load. Please try a different URL.'
        };
      }
    }

    return {
      success: false,
      error: `Error scraping article: ${errorMessage}`
    };
  }
}

/**
 * Batch scrape multiple URLs (useful for future bulk operations)
 */
export async function scrapeMultipleArticles(urls: string[]): Promise<ScraperResponse[]> {
  return Promise.all(urls.map(url => scrapeArticle(url)));
}

import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2, Copy, Trash2, ExternalLink } from 'lucide-react';
import { scrapeArticle, isValidUrl, ScrapedArticle } from '../services/scraperService';
import { saveScrapedArticle } from '../services/articleService';

interface ArticleIngestionPanelProps {
  onArticleSaved?: (articleId: string, article: ScrapedArticle) => void;
}

export const ArticleIngestionPanel: React.FC<ArticleIngestionPanelProps> = ({ onArticleSaved }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedArticle, setScrapedArticle] = useState<ScrapedArticle | null>(null);
  const [saving, setSaving] = useState(false);

  const handleScrapeArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid URL (starting with http:// or https://)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await scrapeArticle(url);
      
      if (!result.success || !result.data) {
        setError(result.error || 'Failed to scrape article');
        return;
      }

      setScrapedArticle(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scrape article');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveArticle = async () => {
    if (!scrapedArticle) return;

    setSaving(true);
    setError(null);

    try {
      const articleId = await saveScrapedArticle({
        sourceUrl: scrapedArticle.url,
        title: scrapedArticle.title,
        originalContent: scrapedArticle.content,
        scrapedAt: scrapedArticle.extractedAt,
        scrapedBy: '', // Will be set by the service
        drafts: {},
        metadata: scrapedArticle.metadata,
        status: 'ingested'
      });

      // Reset form and notify parent
      setUrl('');
      setScrapedArticle(null);
      onArticleSaved?.(articleId, scrapedArticle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setScrapedArticle(null);
    setError(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* Input Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Step 1: Scrape Article</h3>
        
        <form onSubmit={handleScrapeArticle} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Article URL
            </label>
            <input
              id="url"
              type="text"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
            />
            <p className="mt-1 text-xs text-gray-500">
              Paste the URL of the article you want to ingest
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scraping...
                </>
              ) : (
                'Scrape Article'
              )}
            </button>
            {scrapedArticle && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Article Preview */}
      {scrapedArticle && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Step 2: Review & Save</h3>
              <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
                <CheckCircle2 className="w-4 h-4" />
                Article successfully scraped
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
            <p className="text-base text-gray-900 break-words">{scrapedArticle.title}</p>
          </div>

          {/* Source URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source URL</label>
            <div className="flex items-center gap-2">
              <a 
                href={scrapedArticle.url} 
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm truncate flex-1"
              >
                {scrapedArticle.url}
              </a>
              <button
                type="button"
                onClick={() => copyToClipboard(scrapedArticle.url)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy URL"
              >
                <Copy className="w-4 h-4 text-gray-500" />
              </button>
              <a 
                href={scrapedArticle.url} 
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-gray-100 rounded"
                title="Open URL"
              >
                <ExternalLink className="w-4 h-4 text-gray-500" />
              </a>
            </div>
          </div>

          {/* Metadata */}
          {scrapedArticle.metadata && Object.keys(scrapedArticle.metadata).length > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <label className="block text-sm font-medium text-gray-700">Metadata</label>
              {scrapedArticle.metadata.author && (
                <p className="text-sm text-gray-600"><span className="font-medium">Author:</span> {scrapedArticle.metadata.author}</p>
              )}
              {scrapedArticle.metadata.publishDate && (
                <p className="text-sm text-gray-600"><span className="font-medium">Published:</span> {scrapedArticle.metadata.publishDate}</p>
              )}
              {scrapedArticle.metadata.source && (
                <p className="text-sm text-gray-600"><span className="font-medium">Source:</span> {scrapedArticle.metadata.source}</p>
              )}
            </div>
          )}

          {/* Content Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content Preview ({scrapedArticle.content.length} characters)
            </label>
            <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-6">
                {scrapedArticle.content}
              </p>
            </div>
            {scrapedArticle.content.length > 500 && (
              <p className="mt-2 text-xs text-gray-500">
                Showing preview (total content is {scrapedArticle.content.length} characters)
              </p>
            )}
          </div>

          {/* Save Button */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveArticle}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Article'
              )}
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { Loader2, AlertCircle, Copy, RefreshCw, Check } from 'lucide-react';
import { ScrapedArticle, WritingStyle } from '../types';
import { generateDraft, GenerationResponse, GenerationError } from '../services/generationService';
import { saveDraft } from '../services/articleService';

interface DraftGenerationPanelProps {
  article: ScrapedArticle;
  onDraftGenerated?: (draftId: string, draft: GenerationResponse) => void;
}

const WRITING_STYLES: { value: WritingStyle; label: string; description: string }[] = [
  { 
    value: 'editorial', 
    label: 'Editorial', 
    description: 'Balanced perspective with context and implications' 
  },
  { 
    value: 'breaking-news', 
    label: 'Breaking News', 
    description: 'Concise, immediate facts, urgent tone' 
  },
  { 
    value: 'opinion', 
    label: 'Opinion', 
    description: 'Persuasive argument with author perspective' 
  },
  { 
    value: 'feature', 
    label: 'Feature', 
    description: 'Narrative-driven with human interest stories' 
  },
  { 
    value: 'analysis', 
    label: 'Analysis', 
    description: 'Deep dive with data, trends, and implications' 
  }
];

export const DraftGenerationPanel: React.FC<DraftGenerationPanelProps> = ({ 
  article, 
  onDraftGenerated 
}) => {
  const [selectedStyle, setSelectedStyle] = useState<WritingStyle>('editorial');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDraft, setGeneratedDraft] = useState<GenerationResponse | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateDraft = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateDraft(article.originalContent, selectedStyle);
      
      if ('error' in result) {
        setError(result.error);
        return;
      }

      setGeneratedDraft(result as GenerationResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate draft');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!generatedDraft || !article.id) return;

    setSaving(true);
    setError(null);

    try {
      const draftId = await saveDraft(article.id, {
        content: generatedDraft.draft,
        style: selectedStyle,
        generatedAt: generatedDraft.generatedAt,
        generatedBy: '', // Will be set by the service
        tokenUsage: generatedDraft.tokenUsage,
        status: 'draft'
      });

      onDraftGenerated?.(draftId, generatedDraft);
      setGeneratedDraft(null);
      setSelectedStyle('editorial');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyDraft = () => {
    if (!generatedDraft?.draft) return;
    navigator.clipboard.writeText(generatedDraft.draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateDraft = async () => {
    await handleGenerateDraft();
  };

  const estimatedTokens = generatedDraft?.tokenUsage ? 
    generatedDraft.tokenUsage.inputTokens + generatedDraft.tokenUsage.outputTokens : 0;

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Step 3: Generate Draft</h3>

        <div className="space-y-4">
          {/* Style Selector */}
          <div>
            <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-3">
              Writing Style
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {WRITING_STYLES.map((style) => (
                <button
                  key={style.value}
                  onClick={() => setSelectedStyle(style.value)}
                  disabled={loading}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    selectedStyle === style.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  } disabled:opacity-50`}
                >
                  <p className="font-medium text-sm">{style.label}</p>
                  <p className="text-xs text-gray-600">{style.description}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerateDraft}
            disabled={loading || !article.originalContent}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Draft...
              </>
            ) : (
              'Generate Draft'
            )}
          </button>

          {generatedDraft && (
            <p className="text-xs text-gray-500 text-center">
              Tokens used: {generatedDraft.tokenUsage.inputTokens} input + {generatedDraft.tokenUsage.outputTokens} output
            </p>
          )}
        </div>
      </div>

      {/* Generated Draft Display */}
      {generatedDraft && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Generated Draft</h3>
              <p className="text-sm text-gray-500">
                {selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} style
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopyDraft}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                title="Copy to clipboard"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
              <button
                onClick={handleRegenerateDraft}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 text-sm"
                title="Regenerate with same style"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
          </div>

          {/* Draft Content */}
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto border border-gray-200">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {generatedDraft.draft}
            </p>
          </div>

          {/* Token Usage */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="text-xs text-gray-600">Input Tokens</p>
              <p className="text-lg font-semibold text-gray-900">
                {generatedDraft.tokenUsage.inputTokens}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Output Tokens</p>
              <p className="text-lg font-semibold text-gray-900">
                {generatedDraft.tokenUsage.outputTokens}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Tokens</p>
              <p className="text-lg font-semibold text-gray-900">
                {estimatedTokens}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={handleSaveDraft}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Draft'
              )}
            </button>
            <button
              onClick={() => setGeneratedDraft(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Trash2, Eye, Edit2, CheckCircle2, Clock, AlertCircle as AlertIcon } from 'lucide-react';
import { ScrapedArticle, ArticleDraft } from '../types';
import { getArticleDrafts, updateDraftStatus, deleteDraft } from '../services/articleService';

interface DraftManagementPanelProps {
  article: ScrapedArticle;
  onDraftUpdated?: () => void;
}

export const DraftManagementPanel: React.FC<DraftManagementPanelProps> = ({ 
  article,
  onDraftUpdated 
}) => {
  const [drafts, setDrafts] = useState<ArticleDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<ArticleDraft | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const loadDrafts = async () => {
    if (!article.id) return;

    setLoading(true);
    setError(null);

    try {
      const fetchedDrafts = await getArticleDrafts(article.id);
      setDrafts(fetchedDrafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drafts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts();
  }, [article.id]);

  const handleDeleteDraft = async (draftId: string) => {
    if (!article.id || !window.confirm('Are you sure you want to delete this draft?')) return;

    setDeletingId(draftId);
    setError(null);

    try {
      await deleteDraft(article.id, draftId);
      setDrafts(drafts.filter(d => d.id !== draftId));
      if (selectedDraft?.id === draftId) {
        setSelectedDraft(null);
      }
      onDraftUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete draft');
    } finally {
      setDeletingId(null);
    }
  };

  const handleUpdateStatus = async (draftId: string, status: 'draft' | 'approved' | 'published') => {
    if (!article.id) return;

    setUpdatingId(draftId);
    setError(null);

    try {
      await updateDraftStatus(article.id, draftId, status, feedback);
      
      // Update local state
      setDrafts(drafts.map(d => 
        d.id === draftId ? { ...d, status, feedback } : d
      ));
      
      if (selectedDraft?.id === draftId) {
        setSelectedDraft({ ...selectedDraft, status, feedback });
      }
      
      setFeedback('');
      onDraftUpdated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update draft');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'published':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'published':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-center gap-2 text-gray-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading drafts...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Drafts List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Step 4: Manage Drafts</h3>

        {error && (
          <div className="flex items-start gap-3 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {drafts.length === 0 ? (
          <div className="text-center py-8">
            <AlertIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No drafts yet</p>
            <p className="text-sm text-gray-400">Generate your first draft above to see it here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="flex items-start justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                onClick={() => setSelectedDraft(selectedDraft?.id === draft.id ? null : draft)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(draft.status)}`}>
                      {getStatusIcon(draft.status)}
                      {draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-600">
                      {draft.style.charAt(0).toUpperCase() + draft.style.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                    {draft.content.substring(0, 150)}...
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Tokens: {draft.tokenUsage.inputTokens + draft.tokenUsage.outputTokens}</span>
                    <span>{new Date(draft.generatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedDraft(selectedDraft?.id === draft.id ? null : draft);
                  }}
                  className="ml-4 p-2 hover:bg-gray-200 rounded-lg text-gray-600"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Draft Details */}
      {selectedDraft && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-base font-semibold">Draft Details</h4>
              <p className="text-sm text-gray-500">
                {selectedDraft.style.charAt(0).toUpperCase() + selectedDraft.style.slice(1)} - {new Date(selectedDraft.generatedAt).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setSelectedDraft(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Draft Content */}
          <div className="bg-gray-50 p-4 rounded-lg max-h-64 overflow-y-auto border border-gray-200">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {selectedDraft.content}
            </p>
          </div>

          {/* Token Usage */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <p className="text-xs text-gray-600">Input Tokens</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedDraft.tokenUsage.inputTokens}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Output Tokens</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedDraft.tokenUsage.outputTokens}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Total</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedDraft.tokenUsage.inputTokens + selectedDraft.tokenUsage.outputTokens}
              </p>
            </div>
          </div>

          {/* Status Selector */}
          <div className="border-t border-gray-200 pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Draft Status
            </label>
            <div className="flex gap-2 mb-3">
              {(['draft', 'approved', 'published'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => handleUpdateStatus(selectedDraft.id!, status)}
                  disabled={updatingId === selectedDraft.id}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedDraft.status === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  } disabled:opacity-50`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Feedback (optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Add notes or feedback about this draft..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
              {selectedDraft.feedback && (
                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-medium">Previous feedback:</span> {selectedDraft.feedback}
                </p>
              )}
            </div>
          </div>

          {/* Delete Button */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => handleDeleteDraft(selectedDraft.id!)}
              disabled={deletingId === selectedDraft.id}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {deletingId === selectedDraft.id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete Draft
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

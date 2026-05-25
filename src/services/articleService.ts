import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { WritingStyle } from '../config/stylePrompts';

export interface ArticleDraft {
  id?: string;
  content: string;
  style: WritingStyle;
  generatedAt: number;
  generatedBy: string;
  tokenUsage: {
    inputTokens: number;
    outputTokens: number;
  };
  status: 'draft' | 'approved' | 'published';
  feedback?: string;
}

export interface ScrapedArticle {
  id?: string;
  sourceUrl: string;
  title: string;
  originalContent: string;
  scrapedAt: number;
  scrapedBy: string;
  
  drafts: {
    [draftId: string]: ArticleDraft;
  };
  
  metadata?: {
    author?: string;
    source?: string;
    keywords?: string[];
    publishDate?: string;
  };
  
  status: 'ingested' | 'processing' | 'ready';
  error?: string;
}

/**
 * Save a scraped article to Firestore
 */
export async function saveScrapedArticle(article: Omit<ScrapedArticle, 'id'>): Promise<string> {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to save articles');
    }

    const articlesRef = collection(db, 'articles');
    const newArticleRef = doc(articlesRef);

    const articleData: any = {
      ...article,
      scrapedAt: serverTimestamp(),
      scrapedBy: auth.currentUser.uid,
      drafts: {},
      status: 'ingested',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await setDoc(newArticleRef, articleData);
    console.log(`[v0] Saved article: "${article.title}" with ID: ${newArticleRef.id}`);
    
    return newArticleRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'articles');
    throw error;
  }
}

/**
 * Get an article by ID
 */
export async function getArticle(articleId: string): Promise<ScrapedArticle | null> {
  try {
    const articleRef = doc(db, 'articles', articleId);
    const articleSnap = await getDoc(articleRef);

    if (!articleSnap.exists()) {
      return null;
    }

    return {
      id: articleSnap.id,
      ...articleSnap.data() as any
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `articles/${articleId}`);
    throw error;
  }
}

/**
 * Get all articles for the current user
 */
export async function getUserArticles(limit: number = 50): Promise<ScrapedArticle[]> {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to fetch articles');
    }

    const articlesRef = collection(db, 'articles');
    const q = query(
      articlesRef,
      where('scrapedBy', '==', auth.currentUser.uid),
      orderBy('scrapedAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const articles: ScrapedArticle[] = [];

    querySnapshot.forEach((docSnap) => {
      articles.push({
        id: docSnap.id,
        ...docSnap.data() as any
      });
    });

    return articles;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'articles');
    throw error;
  }
}

/**
 * Save a draft for an article
 */
export async function saveDraft(
  articleId: string,
  draft: Omit<ArticleDraft, 'id'>
): Promise<string> {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to save drafts');
    }

    const articleRef = doc(db, 'articles', articleId);
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const draftData: ArticleDraft = {
      id: draftId,
      ...draft,
      generatedBy: auth.currentUser.uid
    };

    await updateDoc(articleRef, {
      [`drafts.${draftId}`]: draftData,
      updatedAt: serverTimestamp(),
      status: 'ready'
    });

    console.log(`[v0] Saved draft "${draftId}" for article "${articleId}"`);
    return draftId;
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `articles/${articleId}/drafts`);
    throw error;
  }
}

/**
 * Get all drafts for an article
 */
export async function getArticleDrafts(articleId: string): Promise<ArticleDraft[]> {
  try {
    const article = await getArticle(articleId);
    if (!article || !article.drafts) {
      return [];
    }

    return Object.values(article.drafts).sort((a, b) => 
      (b.generatedAt || 0) - (a.generatedAt || 0)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `articles/${articleId}/drafts`);
    throw error;
  }
}

/**
 * Update a draft's status
 */
export async function updateDraftStatus(
  articleId: string,
  draftId: string,
  status: 'draft' | 'approved' | 'published',
  feedback?: string
): Promise<void> {
  try {
    const articleRef = doc(db, 'articles', articleId);

    const updateData: any = {
      [`drafts.${draftId}.status`]: status,
      updatedAt: serverTimestamp()
    };

    if (feedback) {
      updateData[`drafts.${draftId}.feedback`] = feedback;
    }

    await updateDoc(articleRef, updateData);
    console.log(`[v0] Updated draft status to "${status}"`);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `articles/${articleId}/drafts/${draftId}`);
    throw error;
  }
}

/**
 * Delete a draft
 */
export async function deleteDraft(articleId: string, draftId: string): Promise<void> {
  try {
    const articleRef = doc(db, 'articles', articleId);

    await updateDoc(articleRef, {
      [`drafts.${draftId}`]: null,
      updatedAt: serverTimestamp()
    });

    console.log(`[v0] Deleted draft "${draftId}"`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `articles/${articleId}/drafts/${draftId}`);
    throw error;
  }
}

/**
 * Delete an entire article
 */
export async function deleteArticle(articleId: string): Promise<void> {
  try {
    if (!auth.currentUser) {
      throw new Error('User must be authenticated to delete articles');
    }

    const articleRef = doc(db, 'articles', articleId);
    await deleteDoc(articleRef);

    console.log(`[v0] Deleted article "${articleId}"`);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `articles/${articleId}`);
    throw error;
  }
}

/**
 * Update article status
 */
export async function updateArticleStatus(
  articleId: string,
  status: 'ingested' | 'processing' | 'ready',
  error?: string
): Promise<void> {
  try {
    const articleRef = doc(db, 'articles', articleId);
    const updateData: any = {
      status,
      updatedAt: serverTimestamp()
    };

    if (error) {
      updateData.error = error;
    }

    await updateDoc(articleRef, updateData);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `articles/${articleId}`);
    throw error;
  }
}

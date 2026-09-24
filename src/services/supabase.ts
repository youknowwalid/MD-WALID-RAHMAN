import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || 'https://nczghbzqpmnkwejrhqpf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jemdoYnpxcG1ua3dlanJocXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNjU5MDAsImV4cCI6MjEwNTg0MTkwMH0.kdHtF6avJMr8uv4d7M8dstICXKJ4M6uD0iZA-llesdo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface DatabaseErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo?: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleDatabaseError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: DatabaseErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path
  };
  console.error('Database Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Map collection/entity names to table names
const TABLE_MAP: Record<string, string> = {
  projects: 'projects',
  services: 'services',
  blogPosts: 'blog_posts',
  resume: 'resume',
  testimonials: 'testimonials',
  pricingPlans: 'pricing_plans',
  contactSubmissions: 'contact_submissions',
  skills: 'skills',
  products: 'products',
  siteConfig: 'site_config',
  users: 'users',
};

const getTableName = (name: string): string => TABLE_MAP[name] || name;

/**
 * Auth functions
 */
export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/admin'
      }
    });
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Auth error:", error);
    throw error;
  }
};

export const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
  }
};

/**
 * Normalizes input data for database insertion
 */
const sanitizeData = (data: any): any => {
  if (data === null || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(sanitizeData);
  const sanitized: any = {};
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (value === undefined) return;
    if (value === null) {
      sanitized[key] = null;
    } else if (typeof value === 'object' && !(value instanceof Date)) {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  });
  return sanitized;
};

/**
 * Collection operations
 */
export const getCollection = async (collectionName: string) => {
  try {
    const tableName = getTableName(collectionName);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist yet or connection failed - return empty array
      console.warn(`Could not load collection ${collectionName} from Supabase:`, error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.warn(`Error getting collection ${collectionName}:`, error);
    return [];
  }
};

export const addDocument = async (collectionName: string, data: any) => {
  try {
    const tableName = getTableName(collectionName);
    const sanitized = sanitizeData(data);
    const id = sanitized.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`);
    const record = {
      ...sanitized,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from(tableName)
      .insert([record])
      .select()
      .single();

    if (error) {
      handleDatabaseError(error, OperationType.CREATE, collectionName);
    }
    return result?.id || id;
  } catch (error) {
    handleDatabaseError(error, OperationType.CREATE, collectionName);
  }
};

export const updateDocument = async (collectionName: string, id: string, data: any) => {
  try {
    const trimmedId = String(id || '').trim();
    if (!trimmedId) {
      throw new Error(`Invalid or empty document ID for update operation.`);
    }
    const tableName = getTableName(collectionName);
    const sanitized = sanitizeData(data);
    const record = {
      ...sanitized,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(tableName)
      .update(record)
      .eq('id', trimmedId);

    if (error) {
      handleDatabaseError(error, OperationType.UPDATE, `${collectionName}/${trimmedId}`);
    }
  } catch (error) {
    handleDatabaseError(error, OperationType.UPDATE, `${collectionName}/${id || 'NULL'}`);
  }
};

export const removeDocument = async (collectionName: string, id: string) => {
  try {
    const trimmedId = String(id || '').trim();
    if (!trimmedId) {
      throw new Error(`Invalid or empty document ID for delete operation.`);
    }
    const tableName = getTableName(collectionName);
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', trimmedId);

    if (error) {
      handleDatabaseError(error, OperationType.DELETE, `${collectionName}/${trimmedId}`);
    }
  } catch (error) {
    handleDatabaseError(error, OperationType.DELETE, `${collectionName}/${id || 'NULL'}`);
  }
};

/**
 * Single document fetch by ID
 */
export const getDocument = async (collectionName: string, id: string) => {
  try {
    const tableName = getTableName(collectionName);
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.warn(`Error getting document ${collectionName}/${id}:`, error.message);
      return null;
    }
    return data;
  } catch (error) {
    console.warn(`Error getting document ${collectionName}/${id}:`, error);
    return null;
  }
};

/**
 * Query documents matching a field
 */
export const queryDocuments = async (collectionName: string, field: string, value: any, limitNum?: number) => {
  try {
    const tableName = getTableName(collectionName);
    let query = supabase.from(tableName).select('*').eq(field, value);
    if (limitNum) {
      query = query.limit(limitNum);
    }
    const { data, error } = await query;
    if (error) {
      console.warn(`Error querying ${collectionName}:`, error.message);
      return [];
    }
    return data || [];
  } catch (error) {
    console.warn(`Error querying ${collectionName}:`, error);
    return [];
  }
};

/**
 * Set document (upsert by id)
 */
export const setDocument = async (collectionName: string, id: string, data: any) => {
  try {
    const tableName = getTableName(collectionName);
    const sanitized = sanitizeData(data);
    const record = {
      ...sanitized,
      id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(tableName)
      .upsert(record, { onConflict: 'id' });

    if (error) {
      handleDatabaseError(error, OperationType.WRITE, `${collectionName}/${id}`);
    }
  } catch (error) {
    handleDatabaseError(error, OperationType.WRITE, `${collectionName}/${id}`);
  }
};

/**
 * Realtime subscription listener for a collection or single document
 */
export const subscribeToCollection = (
  collectionName: string,
  callback: (data: any[]) => void,
  filter?: { column: string; value: any }
) => {
  const tableName = getTableName(collectionName);

  // Initial fetch
  const fetchInitial = async () => {
    let q = supabase.from(tableName).select('*');
    if (filter) {
      q = q.eq(filter.column, filter.value);
    }
    const { data } = await q;
    if (data) {
      callback(data);
    }
  };
  fetchInitial();

  const channel = supabase
    .channel(`public:${tableName}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
      },
      () => {
        fetchInitial();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToDocument = (
  collectionName: string,
  id: string,
  callback: (data: any | null) => void
) => {
  const tableName = getTableName(collectionName);

  const fetchDoc = async () => {
    const { data } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (data) {
      callback(data);
    }
  };
  fetchDoc();

  const channel = supabase
    .channel(`public:${tableName}:${id}-${Date.now()}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        filter: `id=eq.${id}`,
      },
      (payload) => {
        if (payload.new) {
          callback(payload.new);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Aliases for compatibility
export const db = supabase;
export const auth = supabase.auth;

import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey);

export const STORAGE_BUCKETS = {
  RECEIPTS: 'receipts',
  PHOTOS: 'photos',
  DOCUMENTS: 'documents',
} as const;

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const HARDCODED_URL = 'https://qtcexymeadsenoycdvrk.supabase.co';
const HARDCODED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y2V4eW1lYWRzZW5veWNkdnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU5Nzk4MDMsImV4cCI6MjAzMTU1NTgwM30.Vp-7_8G_8-e6oU4S6S689QJ_5beQA-Fx';

// Improved fallback logic to ignore placeholder strings like "undefined" or "null"
const isValidStr = (val: any) => {
  if (!val || typeof val !== 'string') return false;
  const trimmed = val.trim();
  return trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null' && trimmed !== '[object Object]' && !trimmed.startsWith('{{');
};

const VITE_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
const VITE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Also check process.env for environments that might use it (like some build systems)
const P_URL = typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : undefined;
const P_KEY = typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : undefined;

const FINAL_URL = isValidStr(VITE_URL) ? VITE_URL : (isValidStr(P_URL) ? P_URL : HARDCODED_URL);
const FINAL_KEY = isValidStr(VITE_KEY) ? VITE_KEY : (isValidStr(P_KEY) ? P_KEY : HARDCODED_KEY);

const SUPABASE_URL = FINAL_URL.trim().replace(/\/$/, '').replace(/\/rest\/v1$/, '');
const SUPABASE_ANON_KEY = FINAL_KEY.trim();

console.log('Fruit Memory Supabase Status:', {
  endpoint: SUPABASE_URL,
  source: isValidStr(VITE_URL) ? 'Vite Env' : (isValidStr(P_URL) ? 'Process Env' : 'Hardcoded Fallback'),
  keyOk: SUPABASE_ANON_KEY.length > 20
});

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper to generate a stable high-performance user session ID
export function getOrCreateUserId(): string {
  let uid = localStorage.getItem('fruit-memory-user-id');
  if (!uid) {
    uid = 'user_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('fruit-memory-user-id', uid);
  }
  return uid;
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

let SUPABASE_URL = (rawUrl && rawUrl.trim()) || 'https://qtcexymeadsenoycdvrk.supabase.co';
let SUPABASE_ANON_KEY = (rawKey && rawKey.trim()) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y2V4eW1lYWRzZW5veWNkdnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU5Nzk4MDMsImV4cCI6MjAzMTU1NTgwM30.Vp-7_8G_8-e6oU4S6S689QJ_5beQA-Fx';

// Sanitize URL: Remove trailing slash and specifically /rest/v1 if included by mistake
SUPABASE_URL = SUPABASE_URL.replace(/\/$/, '').replace(/\/rest\/v1$/, '');

if (!SUPABASE_URL.startsWith('http')) {
  console.error('Supabase URL must start with http/https');
}

console.log('Fruit Memory Supabase Init:', {
  endpoint: SUPABASE_URL,
  keyPrefix: SUPABASE_ANON_KEY.substring(0, 6) + '...',
  keySuffix: '...' + SUPABASE_ANON_KEY.substring(SUPABASE_ANON_KEY.length - 6),
  source: rawKey ? 'Environment Secret' : 'Hardcoded Default'
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

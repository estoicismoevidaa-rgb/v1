/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || 'https://qtcexymeadsenoycdvrk.supabase.co';
const SUPABASE_ANON_KEY = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0Y2V4eW1lYWRzZW5veWNkdnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU5Nzk4MDMsImV4cCI6MjAzMTU1NTgwM30.Vp-7_8G_8-e6oU4S6S689QJ_5beQA-Fx';

console.log('Memory Fruit initializing Supabase...');

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

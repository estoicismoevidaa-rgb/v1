/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://koerglpwsnisuhjtwfqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXJnbHB3c25pc3VoanR3ZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjAyMzksImV4cCI6MjA5NTg5NjIzOX0.6Q6KXbqcJAZD3gxghWVi15-sEHxfCF9mzhMaEFBKulM';

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

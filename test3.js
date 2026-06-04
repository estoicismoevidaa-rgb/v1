import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://koerglpwsnisuhjtwfqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXJnbHB3c25pc3VoanR3ZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjAyMzksImV4cCI6MjA5NTg5NjIzOX0.6Q6KXbqcJAZD3gxghWVi15-sEHxfCF9mzhMaEFBKulM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const userId = 'user_abc123';
  
  // Try to upsert profile for a guest
  const { data: profile, error } = await supabase.from('profiles').upsert([{ 
    uid: userId, 
    username: 'Guest Player',
    updated_at: new Date().toISOString()
  }]);
  console.log("GUEST PROFILE UPSERT:", { profile, error });
}
run();

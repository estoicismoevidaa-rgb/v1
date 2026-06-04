import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://koerglpwsnisuhjtwfqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXJnbHB3c25pc3VoanR3ZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjAyMzksImV4cCI6MjA5NTg5NjIzOX0.6Q6KXbqcJAZD3gxghWVi15-sEHxfCF9mzhMaEFBKulM';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('player_rewards').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}
test();

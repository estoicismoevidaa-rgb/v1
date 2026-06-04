import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://koerglpwsnisuhjtwfqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXJnbHB3c25pc3VoanR3ZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjAyMzksImV4cCI6MjA5NTg5NjIzOX0.6Q6KXbqcJAZD3gxghWVi15-sEHxfCF9mzhMaEFBKulM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
  const userId = '7c4ad78a-6c0b-49c9-ad49-7faa6475c56e'; // Tainar's ID
  
  // Test 1: Check rooms table
  const { data: rooms, error: e1 } = await supabase.from('rooms').select('id').limit(1);
  console.log("ROOMS CHECK:", { rooms, e1 });
  
  // Test 2: Try to get stats
  const { data: stats, error: e2 } = await supabase.from('stats').select('*').limit(3);
  console.log("STATS:", { stats, e2 });

  // Test 3: Insert stat
  const { data: newStat, error: e3 } = await supabase.from('stats').upsert({
     uid: userId,
     total_points: 100,
     solo_points: 50,
     games_played: 1,
     last_played_at: new Date().toISOString()
  });
  console.log("UPSERT STATS:", { newStat, e3 });
  
  // Test 4: RLS error? Let's trace policy issues
}
run();

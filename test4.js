import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://koerglpwsnisuhjtwfqh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZXJnbHB3c25pc3VoanR3ZnFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMjAyMzksImV4cCI6MjA5NTg5NjIzOX0.6Q6KXbqcJAZD3gxghWVi15-sEHxfCF9mzhMaEFBKulM';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function run() {
  const fakeUuid = uuidv4();
  
  // Try to upsert profile for a guest with valid UUID
  const { data: profile, error } = await supabase.from('profiles').insert([{ 
    uid: fakeUuid, 
    username: 'Guest Player',
    updated_at: new Date().toISOString()
  }]);
  console.log("FAKE UUID PROFILE INSERT:", { profile, error });
}
run();

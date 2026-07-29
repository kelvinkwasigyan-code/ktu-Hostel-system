import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './backend/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function diagnose() {
  console.log('\n=== ALL LANDLORD ACCOUNTS IN REMOTE DB ===');
  const { data: landlords, error: landlordErr } = await supabase
    .from('users')
    .select('user_id, full_name, email, role, verification_status, created_at')
    .eq('role', 'Landlord')
    .order('created_at', { ascending: false });
  if (landlordErr) console.log('Error:', landlordErr.message);
  else console.log(JSON.stringify(landlords, null, 2));

  console.log('\n=== ALL PROPERTIES (latest 10) ===');
  const { data: props, error: propErr } = await supabase
    .from('properties')
    .select('property_id, landlord_id, title, verification_status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
  if (propErr) console.log('Error:', propErr.message);
  else console.log(JSON.stringify(props, null, 2));
}

diagnose();

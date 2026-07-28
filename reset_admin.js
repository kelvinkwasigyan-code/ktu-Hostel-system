// reset_admin.js — Run with: node reset_admin.js
// Resets the admin@ktu.edu.gh password to Admin@123 in the database
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

dotenv.config({ path: './backend/.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const EMAIL = 'admin@ktu.edu.gh';
const PASSWORD = 'Admin@123';

async function resetAdmin() {
  console.log(`\nResetting admin password for: ${EMAIL}`);

  const hash = await bcrypt.hash(PASSWORD, 12);
  console.log('New hash generated:', hash.slice(0, 20) + '...');

  // Check if user exists
  const { data: existing } = await supabase
    .from('users')
    .select('user_id, full_name, role')
    .eq('email', EMAIL)
    .single();

  if (existing) {
    console.log(`Found existing user: ${existing.full_name} (${existing.role})`);

    // Update password hash
    const { error: updateErr } = await supabase
      .from('users')
      .update({ password_hash: hash, is_active: true, verification_status: 'Approved', role: 'Admin' })
      .eq('email', EMAIL);

    if (updateErr) {
      console.error('Update failed:', updateErr.message);
    } else {
      console.log('Password updated successfully!');
    }
  } else {
    console.log('User not found — creating new admin account...');

    const { error: insertErr } = await supabase
      .from('users')
      .insert({
        full_name: 'KTU Admin',
        email: EMAIL,
        phone: '+233241000001',
        password_hash: hash,
        role: 'Admin',
        verification_status: 'Approved',
        is_active: true
      });

    if (insertErr) {
      console.error('Insert failed:', insertErr.message);
    } else {
      console.log('Admin account created successfully!');
    }
  }

  // Verify the hash works
  const verifyMatch = await bcrypt.compare(PASSWORD, hash);
  console.log(`\nVerification: bcrypt.compare('${PASSWORD}', hash) = ${verifyMatch}`);
  console.log('\nDone! Login with:');
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  process.exit(0);
}

resetAdmin().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * reset_users.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Wipes ALL rows from the public.users table and re-seeds 3 fresh demo
 * accounts (Admin, Student, Landlord) with properly bcrypt-hashed passwords.
 *
 * Run from the project root:
 *   node reset_users.js
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Load backend .env
dotenv.config({ path: path.resolve(__dirname, 'backend/.env') });

const SUPABASE_URL  = process.env.SUPABASE_URL;
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

/* ─── Demo users to seed ───────────────────────────────────────────── */
const DEMO_USERS = [
  {
    full_name:           'KTU Admin',
    email:               'admin@ktu.edu.gh',
    phone:               '+233241000001',
    password:            'Admin@123',
    role:                'Admin',
    verification_status: 'Approved',
    is_active:           true,
  },
  {
    full_name:           'Esi Adjoa Quaye',
    email:               'esi.quaye@ktu.edu.gh',
    phone:               '+233554321098',
    password:            'Student@1',
    role:                'Student',
    verification_status: 'Approved',
    is_active:           true,
  },
  {
    full_name:           'Kwame Asante Boateng',
    email:               'kwame.asante@gmail.com',
    phone:               '+233244123456',
    password:            'Landlord@1',
    role:                'Landlord',
    verification_status: 'Approved',
    is_active:           true,
  },
];

async function main() {
  console.log('\n🔍  Finding users with active property listings...');

  // Get all landlord user_ids that have at least one property
  const { data: properties, error: propErr } = await supabase
    .from('properties')
    .select('landlord_id');

  if (propErr) {
    console.error('❌  Could not fetch properties:', propErr.message);
    process.exit(1);
  }

  const keepIds = [...new Set((properties || []).map(p => p.landlord_id).filter(Boolean))];
  console.log(`  ℹ️   Found ${keepIds.length} user(s) with listings — these will be kept.`);

  // Also keep demo emails we are about to re-seed
  const demoEmails = DEMO_USERS.map(u => u.email);

  // Fetch IDs for demo users (they may or may not exist yet)
  const { data: existingDemoRows } = await supabase
    .from('users')
    .select('user_id, email')
    .in('email', demoEmails);

  const existingDemoIds = (existingDemoRows || []).map(r => r.user_id);

  // Combine: keep landlords-with-listings + existing demo accounts
  const allKeepIds = [...new Set([...keepIds, ...existingDemoIds])];

  console.log(`\n🗑️  Deleting users with no listings (sparing ${allKeepIds.length} account(s))...`);

  let deleteQuery = supabase.from('users').delete();

  if (allKeepIds.length > 0) {
    deleteQuery = deleteQuery.not('user_id', 'in', `(${allKeepIds.join(',')})`);
  } else {
    // No accounts to keep — delete everything
    deleteQuery = deleteQuery.neq('user_id', '00000000-0000-0000-0000-000000000000');
  }

  const { error: delErr, count } = await deleteQuery;

  if (delErr) {
    console.warn('  ⚠️  Delete warning:', delErr.message);
  } else {
    console.log(`  ✅  Deleted ${count ?? 'some'} user(s) with no property listings.`);
  }

  console.log('\n🌱  Upserting fresh demo users with new passwords...\n');

  for (const u of DEMO_USERS) {
    const password_hash = await bcrypt.hash(u.password, 12);
    let userId;

    // 1. Try to create the user in Supabase Auth (so they show up in the dashboard)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { role: u.role, full_name: u.full_name }
    });

    if (authError) {
      if (authError.message.includes('already exists')) {
        // If they already exist in auth.users, fetch their UUID
        const { data: existingList } = await supabase.auth.admin.listUsers();
        const existingUser = existingList.users.find(x => x.email === u.email);
        if (existingUser) {
          userId = existingUser.id;
          // Optional: Update their password in Auth if we want to enforce it
          await supabase.auth.admin.updateUserById(userId, { password: u.password });
        }
      } else {
        console.error(`  ❌  Failed to create ${u.email} in Supabase Auth:`, authError.message);
        continue; // Skip public.users insertion if auth fails completely
      }
    } else {
      userId = authData.user.id;
    }

    if (!userId) {
      console.error(`  ❌  Could not resolve a UUID for ${u.email}`);
      continue;
    }

    // 2. Upsert into public.users using the UUID from Supabase Auth
    const { data: existing } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      // Update existing record
      result = await supabase
        .from('users')
        .update({ 
          password_hash, 
          is_active: true, 
          verification_status: u.verification_status,
          role: u.role,
          full_name: u.full_name
        })
        .eq('user_id', userId)
        .select('user_id, email, role')
        .single();
      console.log(`  🔄  Updated  [${u.role.padEnd(8)}]  ${u.email}`);
    } else {
      // Insert fresh record matching Auth UUID
      result = await supabase
        .from('users')
        .insert({
          user_id:             userId,
          full_name:           u.full_name,
          email:               u.email,
          phone:               u.phone,
          password_hash,
          role:                u.role,
          verification_status: u.verification_status,
          is_active:           true,
        })
        .select('user_id, email, role')
        .single();
      console.log(`  ✅  Created  [${u.role.padEnd(8)}]  ${u.email}`);
    }

    if (result.error) {
      console.error(`     ❌  Error: ${result.error.message}`);
    } else {
      console.log(`     Password: ${u.password}`);
    }
  }

  // Show final summary of all remaining users
  const { data: remaining } = await supabase
    .from('users')
    .select('email, role, verification_status');

  console.log(`\n📋  Users remaining in database (${remaining?.length ?? '?'} total):\n`);
  for (const r of (remaining || [])) {
    console.log(`  • [${(r.role || '?').padEnd(8)}]  ${r.email}  (${r.verification_status})`);
  }

  console.log('\n🎉  Done! Fresh credentials:\n');
  console.log('  👑  Admin    — admin@ktu.edu.gh          /  Admin@123');
  console.log('  🎓  Student  — esi.quaye@ktu.edu.gh      /  Student@1');
  console.log('  🏠  Landlord — kwame.asante@gmail.com    /  Landlord@1');
  console.log('');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

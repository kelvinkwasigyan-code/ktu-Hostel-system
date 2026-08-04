import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const ADMIN_EMAIL = 'admin@ktu.edu.gh';
const ADMIN_PASSWORD = 'Admin@123';

async function run() {
  console.log("1. Cleaning up admin from public.users...");
  const { error: delErr } = await supabaseAdmin.from('users').delete().eq('email', ADMIN_EMAIL);
  if (delErr) console.warn("  Warning during public.users delete:", delErr.message);
  else console.log("  ✅ Cleaned public.users");

  console.log("\n2. Checking if admin exists in auth.users...");
  const { data: list } = await supabaseAdmin.auth.admin.listUsers();
  const existing = list?.users?.find(u => u.email === ADMIN_EMAIL);
  if (existing) {
    console.log("  Found existing auth user, deleting...");
    await supabaseAdmin.auth.admin.deleteUser(existing.id);
    console.log("  ✅ Deleted from auth.users");
  } else {
    console.log("  No existing auth user found.");
  }

  console.log("\n3. Attempting to create admin via signUp (bypasses admin API)...");
  const { data: signupData, error: signupErr } = await supabaseAnon.auth.signUp({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    options: {
      data: { role: 'Admin', full_name: 'KTU Admin', phone: 'N/A' }
    }
  });

  if (signupErr) {
    console.error("  signUp failed:", signupErr.message);
    console.error("  This means the database trigger (handle_new_user or fn_audit_log_trigger) is still crashing.");
    console.error("\n  ACTION REQUIRED: Go to Supabase SQL Editor and run:");
    console.error("  SELECT public.handle_new_user();");
    console.error("  to see the exact trigger error.");
  } else {
    console.log("  ✅ Admin created! User ID:", signupData?.user?.id);
    console.log("  Session:", signupData?.session ? "confirmed" : "check email confirmation settings");

    // Now confirm the email via admin API
    if (signupData?.user?.id) {
      const { error: confirmErr } = await supabaseAdmin.auth.admin.updateUserById(
        signupData.user.id,
        { email_confirm: true, password: ADMIN_PASSWORD }
      );
      if (confirmErr) console.warn("  Could not auto-confirm email:", confirmErr.message);
      else console.log("  ✅ Email confirmed via admin API");
    }

    console.log("\n  Insert admin into public.users...");
    const { error: insertErr } = await supabaseAdmin.from('users').upsert({
      auth_id: signupData?.user?.id,
      email: ADMIN_EMAIL,
      full_name: 'KTU Admin',
      phone: 'N/A',
      role: 'Admin',
      verification_status: 'Approved',
      password_hash: 'supabase_auth_managed'
    }, { onConflict: 'email' });

    if (insertErr) console.error("  Failed to insert into public.users:", insertErr.message);
    else console.log("  ✅ Admin row created in public.users");
  }

  console.log("\n✅ Done! Try logging in with:");
  console.log("  Email:    admin@ktu.edu.gh");
  console.log("  Password: Admin@123");
}

run();

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const remoteAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkRemote() {
    console.log("Fetching properties from remote DB...");
    const { data, error } = await remoteAdmin
      .from('properties')
      .select(`
        *,
        property_images (image_path, display_order),
        users!landlord_id (full_name, email, verification_status)
      `)
      .order('created_at', { ascending: false });
      
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Total properties:", data.length);
        const pending = data.filter(p => p.verification_status === 'Pending');
        console.log("Pending properties:", pending.length);
    }
}
checkRemote();

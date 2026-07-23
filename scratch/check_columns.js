import { supabaseAdmin } from '../backend/src/config/supabase.js';

async function check() {
  console.log("Checking columns of table 'properties'...");
  try {
    // We can run a query using rpc or information_schema if permissions allow, or just select a single row with specific columns to test them
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error("Error doing select *:", error);
    } else {
      console.log("Select * succeeded, sample row keys:", data.length > 0 ? Object.keys(data[0]) : "No rows");
    }

    // Check if column exists by selecting it explicitly
    const { data: data2, error: error2 } = await supabaseAdmin
      .from('properties')
      .select('payment_contact_info')
      .limit(1);
    
    if (error2) {
      console.error("Error selecting payment_contact_info:", error2);
    } else {
      console.log("Select payment_contact_info succeeded!");
    }
  } catch (err) {
    console.error("Caught error:", err);
  }
}

check();

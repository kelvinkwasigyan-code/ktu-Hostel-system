// backend/test_audit_logging.js
import { supabaseAdmin } from './src/config/supabase.js';
import { fetchAuditLogs } from './src/services/auditLogger.js';

async function runAuditLogTest() {
  console.log('--- Starting Database-Level Audit Logging Test ---');

  try {
    // 1. Insert a dummy property
    const insertRes = await supabaseAdmin.from('properties').insert({
      title: 'Test Audit Property',
      landlord_id: 'user_1',
      price_per_semester: 1200,
      description: 'Audit logging test description',
      location_name: 'Near Campus'
    }).select();

    const insertedProp = Array.isArray(insertRes.data) ? insertRes.data[0] : insertRes.data;
    console.log('✅ 1. Inserted property:', insertedProp?.property_id || insertedProp?.id);

    // 2. Update the property
    const updateRes = await supabaseAdmin.from('properties')
      .update({ price_per_semester: 1350, description: 'Updated description for audit' })
      .eq('property_id', insertedProp.property_id || insertedProp.id);
    
    console.log('✅ 2. Updated property price to 1350.');

    // 3. Delete the property
    const deleteRes = await supabaseAdmin.from('properties')
      .delete()
      .eq('property_id', insertedProp.property_id || insertedProp.id);

    console.log('✅ 3. Deleted property.');

    // 4. Fetch audit logs
    const auditRes = await fetchAuditLogs({ targetResource: 'properties', limit: 10 });
    console.log(`\n✅ 4. Fetched ${auditRes.logs.length} audit logs for properties resource:`);
    
    auditRes.logs.slice(0, 5).forEach((log, i) => {
      console.log(`\nLog #${i + 1}:`);
      console.log(`  ID:              ${log.id}`);
      console.log(`  Action:          ${log.action}`);
      console.log(`  Resource:        ${log.target_resource}`);
      console.log(`  Target ID:       ${log.target_id}`);
      console.log(`  Created At:      ${log.created_at}`);
      console.log(`  Details Payload:`, JSON.stringify(log.details));
    });

    console.log('\n--- Database-Level Audit Logging Test Passed Successfully! ---');
  } catch (err) {
    console.error('❌ Audit Logging Test Error:', err);
    process.exit(1);
  }
}

runAuditLogTest();

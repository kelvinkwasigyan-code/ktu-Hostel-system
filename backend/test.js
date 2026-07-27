import { createMockSupabase } from './src/config/mockSupabase.js';
const mockAdmin = createMockSupabase();

async function test() {
    const res = await mockAdmin.from('properties').select('*');
    console.log('Total properties:', res.data.length);
    const pending = res.data.filter(p => p.verification_status === 'Pending');
    console.log('Pending properties:', pending.length);
}
test();


import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cikmdkkngifzpulrwkwt.supabase.co";
const supabaseKey = "sb_publishable_Ep5L9b26-0nM3DLUGkOoAw_tiRvU1tK";

const supabase = createClient(supabaseUrl, supabaseKey);

async function testKey() {
    console.log('Testing provided key against project cikmdkkngifzpulrwkwt...');
    try {
        const { data, error } = await supabase.from('profiles').select('count');
        if (error) {
            console.log('❌ Key failed:', error.message);
        } else {
            console.log('✅ Key works! Tracking system is ready.');
        }
    } catch (err) {
        console.log('❌ Exception:', err.message);
    }
}

testKey();

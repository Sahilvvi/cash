
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://cikmdkkngifzpulrwkwt.supabase.co";
const supabaseKey = "sb_publishable_Ep5L9b26-0nM3DLUGkOoAw_tiRvU1tK";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking stores table structure...');
    try {
        const { data, error } = await supabase.rpc('get_table_info', { table_name: 'stores' });
        // RPC might not exist, let's try a direct query to information_schema if allowed, 
        // but anon key usually can't read information_schema.
        // Instead, let's try to insert a dummy banner and see the error.

        console.log('Attempting to fetch banners...');
        const { data: banners, error: bError } = await supabase.from('banners').select('*').limit(1);
        if (bError) {
            console.log('❌ Error fetching banners:', bError.message);
        } else {
            console.log('✅ Successfully fetched banners. Count:', banners.length);
        }

        console.log('Attempting to fetch stores...');
        const { data: stores, error: sError } = await supabase.from('stores').select('*').limit(1);
        if (sError) {
            console.log('❌ Error fetching stores:', sError.message);
        } else {
            console.log('✅ Successfully fetched stores. Count:', stores.length);
        }
    } catch (err) {
        console.log('❌ Exception:', err.message);
    }
}

checkSchema();

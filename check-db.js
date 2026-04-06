import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY must be set in your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStores() {
    console.log('Checking stores in database...');
    try {
        const { data, error } = await supabase
            .from('stores')
            .select('name, network_type')
            .eq('network_type', 'offer18')
            .limit(5);

        if (error) {
            console.error('Error fetching stores:', error.message);
        } else {
            console.log(`Found ${data ? data.length : 0} Offer18 stores:`);
            if (data) data.forEach(store => console.log(`- ${store.name}`));
        }
    } catch (err) {
        console.error('Exception:', err.message);
    }
}

checkStores();

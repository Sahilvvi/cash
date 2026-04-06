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

async function checkProfiles() {
    console.log('Checking profiles table...');
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, email, full_name');

        if (error) {
            console.error('Error fetching profiles:', error.message);
        } else {
            console.log(`Found ${data ? data.length : 0} profiles:`);
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Exception:', err.message);
    }
}

checkProfiles();

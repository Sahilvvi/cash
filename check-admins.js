
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://rmdmcfgifglvtpbmcxov.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZG1jZmdpZmdsdnRwYm1jeG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzg0NzEsImV4cCI6MjA4MjcxNDQ3MX0.LYt63L0FF-QO3rUFNMsm1kNCHEWOZM7dXKhyGmNuZVA";

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAdmins() {
    console.log('Checking admin_users table...');
    try {
        const { data, error } = await supabase
            .from('admin_users')
            .select('*');

        if (error) {
            console.error('Error fetching admins:', error.message);
        } else {
            console.log(`Found ${data ? data.length : 0} rows in admin_users:`);
            console.log(JSON.stringify(data, null, 2));
        }
    } catch (err) {
        console.error('Exception:', err.message);
    }
}

checkAdmins();

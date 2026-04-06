import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHomepageData() {
    console.log('--- Checking Banners ---');
    try {
        const { data: banners, error: bannerError } = await supabase
            .from('banners')
            .select('*')
            .eq('is_active', true);
        
        if (bannerError) {
            console.error('Error fetching banners:', bannerError);
        } else {
            console.log(`Found ${banners?.length || 0} active banners:`);
            banners?.forEach(b => console.log(`- ${b.title || 'Untitled'}: ${b.image_url}`));
        }
    } catch (e) {
        console.error('Exception fetching banners:', e);
    }

    console.log('\n--- Checking Site Settings ---');
    try {
        const { data: settings, error: settingsError } = await supabase
            .from('site_settings')
            .select('*');
        
        if (settingsError) {
            console.error('Error fetching site settings:', settingsError);
        } else {
            console.log(`Found ${settings?.length || 0} site settings:`);
            settings?.forEach(s => console.log(`- ${s.key}: ${s.value}`));
        }
    } catch (e) {
        console.error('Exception fetching site settings:', e);
    }

    console.log('\n--- Checking Categories ---');
    try {
        const { data: categories, error: catError } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true);
        
        if (catError) {
            console.error('Error fetching categories:', catError);
        } else {
            console.log(`Found ${categories?.length || 0} active categories:`);
            categories?.forEach(c => console.log(`- ${c.name}`));
        }
    } catch (e) {
        console.error('Exception fetching categories:', e);
    }
}

checkHomepageData();

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rmdmcfgifglvtpbmcxov.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJtZG1jZmdpZmdsdnRwYm1jeG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxMzg0NzEsImV4cCI6MjA4MjcxNDQ3MX0.LYt63L0FF-QO3rUFNMsm1kNCHEWOZM7dXKhyGmNuZVA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addAdminUser(email: string) {
    console.log('\n🔧 Adding admin user...\n');
    console.log(`Email: ${email}`);

    try {
        // Step 1: Check if user exists
        console.log('\n1️⃣ Checking if user exists...');
        const { data: users, error: userError } = await supabase
            .from('profiles')
            .select('user_id, email, full_name')
            .eq('email', email);

        if (userError) {
            console.error('❌ Error checking user:', userError.message);
            return false;
        }

        if (!users || users.length === 0) {
            console.log('❌ User not found!');
            console.log('\n📝 IMPORTANT: User must sign up first!');
            console.log('   Go to: http://localhost:8080/auth');
            console.log('   Sign up with:', email);
            return false;
        }

        const user = users[0];
        console.log('✅ User found:', user.full_name || 'No name set');

        // Step 2: Check if already admin
        console.log('\n2️⃣ Checking admin status...');
        const { data: existingAdmin, error: adminCheckError } = await supabase
            .from('admin_users')
            .select('id, user_id')
            .eq('user_id', user.user_id)
            .maybeSingle();

        if (adminCheckError) {
            console.error('❌ Error checking admin status:', adminCheckError.message);
            return false;
        }

        if (existingAdmin) {
            console.log('✅ User is already an admin!');
            console.log('\n🎉 You can login at: http://localhost:8080/admin');
            return true;
        }

        // Step 3: Add as admin
        console.log('\n3️⃣ Adding user as admin...');
        const { data: newAdmin, error: insertError } = await supabase
            .from('admin_users')
            .insert({ user_id: user.user_id })
            .select();

        if (insertError) {
            console.error('❌ Error adding admin:', insertError.message);
            return false;
        }

        console.log('✅ Admin user added successfully!');

        // Step 4: Verify
        console.log('\n4️⃣ Verifying admin access...');
        const { data: verifyAdmin, error: verifyError } = await supabase
            .from('admin_users')
            .select('id, created_at')
            .eq('user_id', user.user_id)
            .single();

        if (verifyError || !verifyAdmin) {
            console.error('❌ Verification failed');
            return false;
        }

        console.log('✅ Verification successful!');
        console.log('\n' + '='.repeat(50));
        console.log('🎉 SUCCESS! Admin user created!');
        console.log('='.repeat(50));
        console.log('\n📧 Email:', email);
        console.log('👤 User ID:', user.user_id);
        console.log('⏰ Admin since:', new Date(verifyAdmin.created_at).toLocaleString());
        console.log('\n🚀 Next Steps:');
        console.log('   1. Go to: http://localhost:8080/admin');
        console.log('   2. Login with:', email);
        console.log('   3. Access Offer18 Integration!');
        console.log('\n✨ Offer18 credentials are already configured:');
        console.log('   - Affiliate ID: 744826');
        console.log('   - Merchant ID: 1446');
        console.log('   - API Key: Configured');
        console.log('='.repeat(50) + '\n');

        return true;
    } catch (error: unknown) {
        console.error('❌ Unexpected error:', error instanceof Error ? error.message : error);
        return false;
    }
}

// Run the script
const email = process.argv[2] || 'notsahil@gmail.com';

console.log('\n' + '='.repeat(50));
console.log('🔐 Admin User Setup Script');
console.log('='.repeat(50));

addAdminUser(email).then(success => {
    if (!success) {
        console.log('\n❌ Failed to add admin user');
        console.log('\nTroubleshooting:');
        console.log('1. Make sure user signed up first');
        console.log('2. Check Supabase connection');
        console.log('3. Verify table permissions');
        process.exit(1);
    }
    process.exit(0);
});

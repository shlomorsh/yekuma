// Script to check Supabase table structure and test connection
// Run with: node scripts/check-supabase.js

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Make sure .env.local contains:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=...');
  console.error('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabase() {
  console.log('🔍 Checking Supabase connection...\n');

  // Test connection
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('✅ Supabase connection successful');
    if (user) {
      console.log(`   Logged in as: ${user.email}`);
    } else {
      console.log('   Not logged in (this is OK for testing)');
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    return;
  }

  // Check if references table exists
  console.log('\n📊 Checking references table...');
  
  const { data, error } = await supabase
    .from('references')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error accessing references table:');
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Details:', error.details);
    console.error('   Hint:', error.hint);
    
    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
      console.log('\n💡 The table might not exist. You need to create it in Supabase.');
      console.log('   Go to: Supabase Dashboard → Table Editor → New Table');
      console.log('   Table name: references');
      console.log('   Columns needed:');
      console.log('     - id (uuid, primary key, default: uuid_generate_v4())');
      console.log('     - timestamp (int8)');
      console.log('     - title (text)');
      console.log('     - description (text, nullable)');
      console.log('     - image_url (text, nullable)');
      console.log('     - created_at (timestamptz, default: now())');
    } else if (error.code === '42501' || error.message?.includes('permission denied')) {
      console.log('\n💡 RLS (Row Level Security) might be blocking access.');
      console.log('   Go to: Supabase Dashboard → Authentication → Policies');
      console.log('   Create policies for SELECT and INSERT on references table.');
    }
    return;
  }

  console.log('✅ Table exists and is accessible');
  
  // Get table structure by checking first row
  if (data && data.length > 0) {
    console.log('\n📋 Table structure (from first row):');
    const firstRow = data[0];
    Object.keys(firstRow).forEach(key => {
      const value = firstRow[key];
      const type = typeof value;
      console.log(`   - ${key}: ${type}${value === null ? ' (nullable)' : ''}`);
    });
  } else {
    console.log('   Table is empty (no rows yet)');
  }

  // Count total rows
  const { count, error: countError } = await supabase
    .from('references')
    .select('*', { count: 'exact', head: true });

  if (!countError) {
    console.log(`\n📈 Total rows in table: ${count || 0}`);
  }

  // Test insert (if not logged in, this might fail due to RLS)
  console.log('\n🧪 Testing insert...');
  const testData = {
    timestamp: 0,
    title: 'Test Reference',
    description: 'This is a test',
    image_url: 'https://via.placeholder.com/400x300'
  };

  const { data: insertData, error: insertError } = await supabase
    .from('references')
    .insert([testData])
    .select()
    .single();

  if (insertError) {
    console.error('❌ Insert test failed:');
    console.error('   Code:', insertError.code);
    console.error('   Message:', insertError.message);
    console.error('   Details:', insertError.details);
    
    if (insertError.code === '42501' || insertError.message?.includes('permission denied')) {
      console.log('\n💡 RLS is blocking INSERT. You need to:');
      console.log('   1. Create an INSERT policy for authenticated users');
      console.log('   2. Or disable RLS (not recommended for production)');
    }
  } else {
    console.log('✅ Insert test successful!');
    console.log('   Created test row with id:', insertData.id);
    
    // Clean up - delete test row
    const { error: deleteError } = await supabase
      .from('references')
      .delete()
      .eq('id', insertData.id);
    
    if (!deleteError) {
      console.log('   Test row deleted');
    }
  }
}

checkSupabase().catch(console.error);


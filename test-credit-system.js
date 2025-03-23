const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://cgqwaihuqfdbzkoxygpo.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'YOUR_SUPABASE_ANON_KEY'; // Replace with your anon key

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Simple query to test connection
    const { data, error } = await supabase
      .from('profiles')
      .select('id, credits')
      .limit(1);
    
    if (error) throw error;
    
    console.log('Connection successful!');
    console.log('Sample profile data:', data);
    
    return true;
  } catch (error) {
    console.error('Connection failed:', error.message);
    return false;
  }
}

async function testCreditSystem() {
  try {
    // Get current exchange rate
    const { data: exchangeRate, error: exchangeError } = await supabase
      .rpc('get_current_exchange_rate');
    
    if (exchangeError) throw exchangeError;
    
    console.log('Current exchange rate:', exchangeRate);
    
    // Get transaction history (requires authentication)
    console.log('To test transaction history and other authenticated functions, you need to be logged in.');
    
    return true;
  } catch (error) {
    console.error('Error testing credit system:', error.message);
    return false;
  }
}

async function main() {
  console.log('Testing database connection...');
  const connected = await testConnection();
  
  if (connected) {
    console.log('\nTesting credit system...');
    await testCreditSystem();
  }
}

main().catch(console.error); 
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import chalk from 'chalk';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(chalk.red('Error: Missing Supabase credentials in .env file'));
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY defined');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log(chalk.blue('🧪 Testing Credit Economy Functions 🧪\n'));

// Helper function to run tests
async function runTest(name, testFn) {
  try {
    console.log(chalk.yellow(`Running test: ${name}`));
    await testFn();
    console.log(chalk.green(`✅ Test passed: ${name}\n`));
  } catch (error) {
    console.error(chalk.red(`❌ Test failed: ${name}`));
    console.error(chalk.red(error.message || error));
    console.log('\n');
  }
}

// Test getting current exchange rate
async function testGetExchangeRate() {
  const { data, error } = await supabase.rpc('get_current_exchange_rate');
  
  if (error) throw error;
  
  console.log('Current exchange rate:', data);
  
  if (!data || !data.credits_to_cash_ratio) {
    throw new Error('Exchange rate data is invalid');
  }
}

// Main test function
async function runTests() {
  try {
    // First sign in with test user (if available) or use current session
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      throw new Error(`Authentication error: ${authError.message}`);
    }
    
    if (!session) {
      console.log(chalk.yellow('No active session found. Some tests might fail.'));
      console.log(chalk.yellow('Consider signing in first using:'));
      console.log(chalk.yellow('supabase auth login\n'));
    } else {
      console.log(chalk.green(`Logged in as: ${session.user.email}\n`));
    }
    
    // Run tests
    await runTest('Get Current Exchange Rate', testGetExchangeRate);
    
    // Add more tests as needed:
    // - Test adding credits
    // - Test using credits
    // - Test credit exchange requests
    
    console.log(chalk.blue('\n🎉 All tests completed!'));
  } catch (error) {
    console.error(chalk.red('\n❌ Test suite failed:'));
    console.error(chalk.red(error.message || error));
  }
}

// Run the tests
runTests(); 
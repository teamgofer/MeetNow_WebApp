// Example script demonstrating how to use the PostgreSQL connection
import pool, { query, getClient } from './postgres.js';

// Example function to test the connection
async function testConnection() {
  try {
    // Simple query to test the connection
    const result = await query('SELECT NOW() as current_time');
    console.log('Connection successful!');
    console.log('Current database time:', result.rows[0].current_time);
    return result;
  } catch (error) {
    console.error('Error connecting to PostgreSQL:', error);
    throw error;
  }
}

// Example function to execute a transaction
async function executeTransaction() {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    
    // Example transaction operations
    await client.query('SELECT 1');
    
    await client.query('COMMIT');
    console.log('Transaction completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Example usage
// Uncomment the following lines to test the connection
/*
testConnection()
  .then(() => console.log('Connection test completed'))
  .catch(err => console.error('Connection test failed:', err));
*/

export { testConnection, executeTransaction };
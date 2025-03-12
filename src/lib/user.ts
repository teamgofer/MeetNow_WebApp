import { query, withTransaction, User, Transaction } from './db';
import { hash, compare } from 'bcrypt';

export async function createUser(data: {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'moderator' | 'user';
}): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const passwordHash = await hash(data.password, 10);
    const result = await query(
      `INSERT INTO users (username, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, store_credit, created_at`,
      [data.username, data.email, passwordHash, data.role || 'user']
    );

    return { success: true, user: result.rows[0] };
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.constraint === 'users_username_key') {
      return { success: false, error: 'Username already taken' };
    }
    if (error.constraint === 'users_email_key') {
      return { success: false, error: 'Email already registered' };
    }
    return { success: false, error: 'Failed to create user' };
  }
}

export async function authenticateUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const result = await query(
      'SELECT id, username, email, password_hash, role, store_credit, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return { success: false, error: 'Invalid credentials' };
    }

    const user = result.rows[0];
    const validPassword = await compare(password, user.password_hash);

    if (!validPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    delete user.password_hash;
    return { success: true, user };
  } catch (error) {
    console.error('Error authenticating user:', error);
    return { success: false, error: 'Authentication failed' };
  }
}

export async function addStoreCredit(userId: number, amount: number): Promise<{ success: boolean; balance?: number; error?: string }> {
  return withTransaction(async (client) => {
    try {
      // Add transaction record
      await client.query(
        'INSERT INTO transactions (user_id, amount, transaction_type) VALUES ($1, $2, $3)',
        [userId, amount, 'purchase']
      );

      // Update user's store credit
      const result = await client.query(
        'UPDATE users SET store_credit = store_credit + $1 WHERE id = $2 RETURNING store_credit',
        [amount, userId]
      );

      return { success: true, balance: result.rows[0].store_credit };
    } catch (error) {
      console.error('Error adding store credit:', error);
      return { success: false, error: 'Failed to add store credit' };
    }
  });
}

export async function spendStoreCredit(userId: number, amount: number): Promise<{ success: boolean; balance?: number; error?: string }> {
  return withTransaction(async (client) => {
    try {
      // Check if user has enough credit
      const user = await client.query(
        'SELECT store_credit FROM users WHERE id = $1',
        [userId]
      );

      if (user.rows[0].store_credit < amount) {
        return { success: false, error: 'Insufficient store credit' };
      }

      // Add transaction record
      await client.query(
        'INSERT INTO transactions (user_id, amount, transaction_type) VALUES ($1, $2, $3)',
        [userId, -amount, 'spend']
      );

      // Update user's store credit
      const result = await client.query(
        'UPDATE users SET store_credit = store_credit - $1 WHERE id = $2 RETURNING store_credit',
        [amount, userId]
      );

      return { success: true, balance: result.rows[0].store_credit };
    } catch (error) {
      console.error('Error spending store credit:', error);
      return { success: false, error: 'Failed to spend store credit' };
    }
  });
}

export async function updateUserLocation(userId: number, lat: number, lng: number): Promise<{ success: boolean; error?: string }> {
  try {
    await query(
      `INSERT INTO user_locations (user_id, latitude, longitude)
       VALUES ($1, $2, $3)`,
      [userId, lat, lng]
    );
    return { success: true };
  } catch (error) {
    console.error('Error updating user location:', error);
    return { success: false, error: 'Failed to update location' };
  }
}

export async function getUserTransactions(userId: number): Promise<Transaction[]> {
  try {
    const result = await query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching user transactions:', error);
    return [];
  }
} 
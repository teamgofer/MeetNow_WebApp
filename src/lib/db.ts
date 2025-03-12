import { Pool } from 'pg';

// Database configuration
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Helper function to run queries
export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

// Transaction helper
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Geospatial helper functions
export const geo = {
  // Create a PostGIS point from latitude and longitude
  createPoint: (lat: number, lng: number) => {
    return `SRID=4326;POINT(${lng} ${lat})`;
  },

  // Find locations within a radius (in meters)
  withinRadius: (lat: number, lng: number, radiusInMeters: number) => {
    return `ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $3
    )`;
  },

  // Calculate distance between two points
  distance: (lat1: number, lng1: number, lat2: number, lng2: number) => {
    return `ST_Distance(
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
    )`;
  }
};

// User types
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'moderator' | 'user';
  store_credit: number;
  created_at: Date;
}

// Post types
export interface Post {
  id: number;
  user_id: number;
  parent_id?: number;
  content: string;
  restriction: 'public' | 'private' | 'group' | 'premium';
  created_at: Date;
  location: {
    lat: number;
    lng: number;
  };
}

// Group types
export interface Group {
  id: number;
  name: string;
  description?: string;
  created_at: Date;
}

// Transaction types
export interface Transaction {
  id: number;
  user_id: number;
  amount: number;
  transaction_type: 'purchase' | 'spend';
  created_at: Date;
}

export default pool; 
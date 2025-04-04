import { Pool } from 'pg';

// Database configuration
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
  ssl:
    process.env.NODE_ENV === 'production'
      ? {
          rejectUnauthorized: false,
        }
      : false,
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
};

export default pool;

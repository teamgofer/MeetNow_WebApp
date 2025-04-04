import { Pool } from 'pg';
const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DB,
    password: process.env.POSTGRES_PASSWORD,
    port: parseInt(process.env.POSTGRES_PORT ?? '5432'),
    ssl: process.env.NODE_ENV === 'production'
        ? {
            rejectUnauthorized: false,
        }
        : false,
});
export async function query(text, params) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    }
    finally {
        client.release();
    }
}
export const geo = {
    createPoint: (lat, lng) => {
        return `SRID=4326;POINT(${lng} ${lat})`;
    },
    withinRadius: (lat, lng, radiusInMeters) => {
        return `ST_DWithin(
      location::geography,
      ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
      $3
    )`;
    },
};
export default pool;
//# sourceMappingURL=db.js.map
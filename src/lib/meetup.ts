import { query, geo } from './db';

export interface Meetup {
  id: string;
  title: string;
  description?: string;
  location: {
    lat: number;
    lng: number;
  };
  address: string;
  creator_id?: string;
  image_url?: string;
  created_at: Date;
  expires_at: Date;
}

export async function createFreeMeetup(data: {
  title: string;
  description?: string;
  location: { lat: number; lng: number };
  address: string;
  image?: string;
}) {
  try {
    const point = geo.createPoint(data.location.lat, data.location.lng);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    const result = await query(
      `INSERT INTO meetups (
        title, description, location, address, image_url, expires_at
      ) VALUES (
        $1, $2, ST_GeogFromText($3), $4, $5, $6
      ) RETURNING id`,
      [
        data.title,
        data.description || null,
        point,
        data.address,
        data.image || null,
        expiresAt
      ]
    );

    return { success: true, meetupId: result.rows[0].id };
  } catch (error) {
    console.error('Error creating meetup:', error);
    return { success: false, error: 'Failed to create meetup' };
  }
}

export async function getNearbyFreeMeetups(location: { lat: number; lng: number }) {
  try {
    const result = await query(
      `SELECT 
        id, title, description, 
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        address, creator_id, image_url,
        created_at, expires_at
      FROM meetups
      WHERE 
        ${geo.withinRadius(location.lat, location.lng, 5000)}
        AND expires_at > NOW()
      ORDER BY 
        ST_Distance(
          location::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        )
      LIMIT 50`,
      [location.lng, location.lat, 5000]
    );

    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      location: {
        lat: row.latitude,
        lng: row.longitude
      },
      address: row.address,
      creator_id: row.creator_id,
      image_url: row.image_url,
      created_at: row.created_at,
      expires_at: row.expires_at
    }));
  } catch (error) {
    console.error('Error fetching nearby meetups:', error);
    return [];
  }
} 
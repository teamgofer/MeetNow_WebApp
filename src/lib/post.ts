import { query, withTransaction, Post, geo } from './db';

export async function createPost(data: {
  userId: number;
  content: string;
  location: { lat: number; lng: number };
  restriction?: 'public' | 'private' | 'group' | 'premium';
  parentId?: number;
  groupIds?: number[];
}): Promise<{ success: boolean; post?: Post; error?: string }> {
  return withTransaction(async (client) => {
    try {
      const point = geo.createPoint(data.location.lat, data.location.lng);
      
      // Create the post
      const postResult = await client.query(
        `INSERT INTO posts (user_id, parent_id, content, restriction, location)
         VALUES ($1, $2, $3, $4, ST_GeogFromText($5))
         RETURNING *`,
        [
          data.userId,
          data.parentId || null,
          data.content,
          data.restriction || 'public',
          point
        ]
      );

      const post = postResult.rows[0];

      // If the post is group-restricted, add group visibility
      if (data.restriction === 'group' && data.groupIds && data.groupIds.length > 0) {
        const values = data.groupIds.map((_, i) => `($1, $${i + 2})`).join(',');
        await client.query(
          `INSERT INTO post_visibility (post_id, group_id) VALUES ${values}`,
          [post.id, ...data.groupIds]
        );
      }

      return { success: true, post };
    } catch (error) {
      console.error('Error creating post:', error);
      return { success: false, error: 'Failed to create post' };
    }
  });
}

export async function getNearbyPosts(params: {
  location: { lat: number; lng: number };
  userId?: number;
  radius?: number; // in meters
  limit?: number;
}): Promise<Post[]> {
  try {
    const radius = params.radius || 5000; // Default 5km
    const limit = params.limit || 50;

    const result = await query(
      `WITH visible_posts AS (
        SELECT DISTINCT p.* FROM posts p
        LEFT JOIN post_visibility pv ON p.id = pv.post_id
        LEFT JOIN user_groups ug ON ug.group_id = pv.group_id AND ug.user_id = $1
        WHERE
          (p.restriction = 'public') OR
          (p.restriction = 'private' AND p.user_id = $1) OR
          (p.restriction = 'group' AND ug.user_id IS NOT NULL) OR
          (p.restriction = 'premium' AND EXISTS (
            SELECT 1 FROM users WHERE id = $1 AND store_credit > 0
          ))
      )
      SELECT 
        id, user_id, parent_id, content, restriction,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        created_at
      FROM visible_posts
      WHERE ${geo.withinRadius(params.location.lat, params.location.lng, radius)}
      ORDER BY created_at DESC
      LIMIT $4`,
      [params.userId || null, params.location.lng, params.location.lat, limit]
    );

    return result.rows.map(row => ({
      ...row,
      location: {
        lat: row.latitude,
        lng: row.longitude
      }
    }));
  } catch (error) {
    console.error('Error fetching nearby posts:', error);
    return [];
  }
}

export async function getPostReplies(postId: number): Promise<Post[]> {
  try {
    const result = await query(
      `SELECT 
        id, user_id, parent_id, content, restriction,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        created_at
      FROM posts
      WHERE parent_id = $1
      ORDER BY created_at ASC`,
      [postId]
    );

    return result.rows.map(row => ({
      ...row,
      location: {
        lat: row.latitude,
        lng: row.longitude
      }
    }));
  } catch (error) {
    console.error('Error fetching post replies:', error);
    return [];
  }
}

export async function getUserPosts(userId: number): Promise<Post[]> {
  try {
    const result = await query(
      `SELECT 
        id, user_id, parent_id, content, restriction,
        ST_X(location::geometry) as longitude,
        ST_Y(location::geometry) as latitude,
        created_at
      FROM posts
      WHERE user_id = $1
      ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      ...row,
      location: {
        lat: row.latitude,
        lng: row.longitude
      }
    }));
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
} 
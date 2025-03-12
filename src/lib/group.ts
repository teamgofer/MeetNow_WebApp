import { query, withTransaction, Group } from './db';

export async function createGroup(data: {
  name: string;
  description?: string;
  creatorId: number;
}): Promise<{ success: boolean; group?: Group; error?: string }> {
  return withTransaction(async (client) => {
    try {
      // Create the group
      const groupResult = await client.query(
        `INSERT INTO groups (name, description)
         VALUES ($1, $2)
         RETURNING *`,
        [data.name, data.description || null]
      );

      const group = groupResult.rows[0];

      // Add creator as admin
      await client.query(
        `INSERT INTO user_groups (user_id, group_id, role)
         VALUES ($1, $2, 'admin')`,
        [data.creatorId, group.id]
      );

      return { success: true, group };
    } catch (error: any) {
      console.error('Error creating group:', error);
      if (error.constraint === 'groups_name_key') {
        return { success: false, error: 'Group name already taken' };
      }
      return { success: false, error: 'Failed to create group' };
    }
  });
}

export async function addUserToGroup(groupId: number, userId: number, role: 'member' | 'admin' = 'member'): Promise<{ success: boolean; error?: string }> {
  try {
    await query(
      `INSERT INTO user_groups (user_id, group_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, group_id) DO UPDATE
       SET role = EXCLUDED.role`,
      [userId, groupId, role]
    );
    return { success: true };
  } catch (error) {
    console.error('Error adding user to group:', error);
    return { success: false, error: 'Failed to add user to group' };
  }
}

export async function removeUserFromGroup(groupId: number, userId: number): Promise<{ success: boolean; error?: string }> {
  try {
    await query(
      'DELETE FROM user_groups WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    return { success: true };
  } catch (error) {
    console.error('Error removing user from group:', error);
    return { success: false, error: 'Failed to remove user from group' };
  }
}

export async function getUserGroups(userId: number): Promise<{ group: Group; role: string }[]> {
  try {
    const result = await query(
      `SELECT g.*, ug.role
       FROM groups g
       JOIN user_groups ug ON g.id = ug.group_id
       WHERE ug.user_id = $1`,
      [userId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }
}

export async function getGroupMembers(groupId: number): Promise<{ userId: number; role: string }[]> {
  try {
    const result = await query(
      `SELECT user_id, role
       FROM user_groups
       WHERE group_id = $1`,
      [groupId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching group members:', error);
    return [];
  }
}

export async function isGroupAdmin(groupId: number, userId: number): Promise<boolean> {
  try {
    const result = await query(
      `SELECT 1
       FROM user_groups
       WHERE group_id = $1 AND user_id = $2 AND role = 'admin'`,
      [groupId, userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking group admin status:', error);
    return false;
  }
} 
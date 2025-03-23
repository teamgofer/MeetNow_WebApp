import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Check if user is an admin
const checkAdmin = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
    
  if (error || !data) return false;
  return data.role === 'admin';
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the user from the request
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  // Check if user is an admin
  const isAdmin = await checkAdmin(user.id);
  
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  
  // Handle different HTTP methods
  switch (req.method) {
    case 'GET':
      return getRollouts(req, res);
    case 'POST':
      return createRollout(req, res);
    case 'PUT':
      return updateRollout(req, res);
    case 'DELETE':
      return deleteRollout(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get all rollouts or a specific rollout
async function getRollouts(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (id) {
    // Get a specific rollout
    const { data, error } = await supabase
      .from('feature_rollout_schedule')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      return res.status(404).json({ error: 'Rollout not found' });
    }
    
    return res.status(200).json(data);
  } else {
    // Get all rollouts
    const { data, error } = await supabase
      .from('feature_rollout_schedule')
      .select('*')
      .order('start_date', { ascending: true });
      
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch rollouts' });
    }
    
    return res.status(200).json(data);
  }
}

// Create a new rollout schedule
async function createRollout(req: NextApiRequest, res: NextApiResponse) {
  const { 
    feature_name, 
    rollout_phase, 
    target_regions, 
    start_date, 
    end_date,
    status,
    notes
  } = req.body;
  
  // Basic validation
  if (!feature_name || !rollout_phase || !target_regions || !Array.isArray(target_regions)) {
    return res.status(400).json({ 
      error: 'Feature name, rollout phase, and target regions (array) are required' 
    });
  }
  
  // Validate that target regions exist
  if (target_regions.length > 0) {
    const { data: regionData, error: regionError } = await supabase
      .from('supported_regions')
      .select('id, region_name')
      .in('region_name', target_regions);
      
    if (regionError) {
      return res.status(500).json({ error: 'Failed to validate target regions' });
    }
    
    if (regionData.length !== target_regions.length) {
      const foundRegions = regionData.map(r => r.region_name);
      const missingRegions = target_regions.filter(r => !foundRegions.includes(r));
      
      return res.status(400).json({ 
        error: 'Some target regions do not exist', 
        missing: missingRegions 
      });
    }
  }
  
  // Insert new rollout schedule
  const { data, error } = await supabase
    .from('feature_rollout_schedule')
    .insert({
      feature_name,
      rollout_phase,
      target_regions,
      start_date: start_date || null,
      end_date: end_date || null,
      status: status || 'planned',
      notes: notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating rollout schedule:', error);
    return res.status(500).json({ 
      error: 'Failed to create rollout schedule', 
      details: error.message 
    });
  }
  
  return res.status(201).json(data);
}

// Update an existing rollout schedule
async function updateRollout(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { 
    feature_name, 
    rollout_phase, 
    target_regions, 
    start_date, 
    end_date,
    status,
    notes
  } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Rollout ID is required' });
  }
  
  // Validate target regions if provided
  if (target_regions && Array.isArray(target_regions) && target_regions.length > 0) {
    const { data: regionData, error: regionError } = await supabase
      .from('supported_regions')
      .select('id, region_name')
      .in('region_name', target_regions);
      
    if (regionError) {
      return res.status(500).json({ error: 'Failed to validate target regions' });
    }
    
    if (regionData.length !== target_regions.length) {
      const foundRegions = regionData.map(r => r.region_name);
      const missingRegions = target_regions.filter(r => !foundRegions.includes(r));
      
      return res.status(400).json({ 
        error: 'Some target regions do not exist', 
        missing: missingRegions 
      });
    }
  }
  
  // Build update object with only provided fields
  const updateData: any = { updated_at: new Date().toISOString() };
  
  if (feature_name !== undefined) updateData.feature_name = feature_name;
  if (rollout_phase !== undefined) updateData.rollout_phase = rollout_phase;
  if (target_regions !== undefined) updateData.target_regions = target_regions;
  if (start_date !== undefined) updateData.start_date = start_date;
  if (end_date !== undefined) updateData.end_date = end_date;
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  
  // Update the rollout schedule
  const { data, error } = await supabase
    .from('feature_rollout_schedule')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating rollout schedule:', error);
    return res.status(500).json({ 
      error: 'Failed to update rollout schedule', 
      details: error.message 
    });
  }
  
  return res.status(200).json(data);
}

// Delete a rollout schedule
async function deleteRollout(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Rollout ID is required' });
  }
  
  // Check if rollout is in progress
  const { data: rolloutData, error: rolloutError } = await supabase
    .from('feature_rollout_schedule')
    .select('status')
    .eq('id', id)
    .single();
    
  if (rolloutError) {
    return res.status(404).json({ error: 'Rollout not found' });
  }
  
  // If rollout is in progress, prevent deletion
  if (rolloutData && rolloutData.status === 'in-progress') {
    return res.status(400).json({ 
      error: 'Cannot delete a rollout that is in progress' 
    });
  }
  
  // Delete the rollout
  const { error } = await supabase
    .from('feature_rollout_schedule')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting rollout schedule:', error);
    return res.status(500).json({ 
      error: 'Failed to delete rollout schedule', 
      details: error.message 
    });
  }
  
  return res.status(200).json({ 
    success: true, 
    message: 'Rollout schedule deleted successfully' 
  });
} 
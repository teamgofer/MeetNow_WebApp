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
      return getRegions(req, res);
    case 'POST':
      return createRegion(req, res);
    case 'PUT':
      return updateRegion(req, res);
    case 'DELETE':
      return deleteRegion(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

// Get all regions or a specific region
async function getRegions(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (id) {
    // Get a specific region
    const { data, error } = await supabase
      .from('supported_regions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      return res.status(404).json({ error: 'Region not found' });
    }
    
    return res.status(200).json(data);
  } else {
    // Get all regions
    const { data, error } = await supabase
      .from('supported_regions')
      .select('*')
      .order('rollout_phase', { ascending: true })
      .order('region_name', { ascending: true });
      
    if (error) {
      return res.status(500).json({ error: 'Failed to fetch regions' });
    }
    
    return res.status(200).json(data);
  }
}

// Create a new region
async function createRegion(req: NextApiRequest, res: NextApiResponse) {
  const { 
    region_name, 
    country_code, 
    state_province, 
    city_name, 
    latitude, 
    longitude, 
    radius_km, 
    features, 
    rollout_phase,
    is_active 
  } = req.body;
  
  // Basic validation
  if (!region_name || !country_code) {
    return res.status(400).json({ error: 'Region name and country code are required' });
  }
  
  // Create GEOGRAPHY point if coordinates are provided
  let coordinates = null;
  if (latitude && longitude) {
    coordinates = `POINT(${longitude} ${latitude})`;
  }
  
  // Insert new region
  const { data, error } = await supabase
    .from('supported_regions')
    .insert({
      region_name,
      country_code,
      state_province,
      city_name,
      coordinates: coordinates ? coordinates : null,
      radius_km: radius_km || 50, // Default to 50km
      features: features || {}, // Default to empty object
      rollout_phase: rollout_phase || 1, // Default to phase 1
      is_active: is_active !== undefined ? is_active : true, // Default to active
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating region:', error);
    return res.status(500).json({ error: 'Failed to create region', details: error.message });
  }
  
  return res.status(201).json(data);
}

// Update an existing region
async function updateRegion(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const { 
    region_name, 
    country_code, 
    state_province, 
    city_name, 
    latitude, 
    longitude, 
    radius_km, 
    features, 
    rollout_phase,
    is_active 
  } = req.body;
  
  if (!id) {
    return res.status(400).json({ error: 'Region ID is required' });
  }
  
  // Create GEOGRAPHY point if coordinates are provided
  let coordinates = null;
  if (latitude !== undefined && longitude !== undefined) {
    if (latitude === null && longitude === null) {
      coordinates = null; // Allow clearing coordinates
    } else {
      coordinates = `POINT(${longitude} ${latitude})`;
    }
  }
  
  // Build update object with only provided fields
  const updateData: any = { updated_at: new Date().toISOString() };
  
  if (region_name !== undefined) updateData.region_name = region_name;
  if (country_code !== undefined) updateData.country_code = country_code;
  if (state_province !== undefined) updateData.state_province = state_province;
  if (city_name !== undefined) updateData.city_name = city_name;
  if (coordinates !== undefined) updateData.coordinates = coordinates;
  if (radius_km !== undefined) updateData.radius_km = radius_km;
  if (features !== undefined) updateData.features = features;
  if (rollout_phase !== undefined) updateData.rollout_phase = rollout_phase;
  if (is_active !== undefined) updateData.is_active = is_active;
  
  // Update the region
  const { data, error } = await supabase
    .from('supported_regions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating region:', error);
    return res.status(500).json({ error: 'Failed to update region', details: error.message });
  }
  
  return res.status(200).json(data);
}

// Delete a region
async function deleteRegion(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  
  if (!id) {
    return res.status(400).json({ error: 'Region ID is required' });
  }
  
  // Check if region is used in rollout schedules
  const { data: rolloutData, error: rolloutError } = await supabase
    .from('feature_rollout_schedule')
    .select('id')
    .contains('target_regions', [id]);
    
  if (rolloutError) {
    console.error('Error checking rollout schedules:', rolloutError);
    return res.status(500).json({ error: 'Failed to check rollout schedules' });
  }
  
  // If region is used in rollout schedules, prevent deletion
  if (rolloutData && rolloutData.length > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete region that is used in rollout schedules',
      rollouts: rolloutData.length
    });
  }
  
  // Delete the region
  const { error } = await supabase
    .from('supported_regions')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting region:', error);
    return res.status(500).json({ error: 'Failed to delete region', details: error.message });
  }
  
  return res.status(200).json({ success: true, message: 'Region deleted successfully' });
} 
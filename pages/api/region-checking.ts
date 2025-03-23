import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lat, lng, requiredCategory, requiredFeature } = req.body;

    // Validate required parameters
    if (!lat || !lng || !requiredCategory) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Please provide lat, lng, and requiredCategory.' 
      });
    }

    // Parse coordinates
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ error: 'Invalid coordinates provided.' });
    }

    // Call the Supabase function to get available features
    const { data: availableFeatures, error: featuresError } = await supabase.rpc(
      'get_available_features',
      { lat: latitude, lng: longitude }
    );

    if (featuresError) {
      console.error('Error getting available features:', featuresError);
      return res.status(500).json({ 
        error: 'Failed to check feature availability.', 
        details: featuresError.message 
      });
    }

    // Check if features are available
    let isFeatureAvailable = false;
    
    if (
      availableFeatures?.features?.[requiredCategory]?.enabled === true &&
      (!requiredFeature || 
        (availableFeatures?.features?.[requiredCategory]?.features?.includes(requiredFeature)))
    ) {
      isFeatureAvailable = true;
    }

    // Return the result
    return res.status(200).json({
      isFeatureAvailable,
      region: {
        name: availableFeatures?.region_name,
        country: availableFeatures?.country_code,
        city: availableFeatures?.city_name,
      },
      availableFeatures: availableFeatures?.features,
    });
  } catch (error) {
    console.error('Error in region-checking API:', error);
    return res.status(500).json({ 
      error: 'An unexpected error occurred while checking region availability.' 
    });
  }
}

// Example API call:
// 
// fetch('/api/region-checking', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({
//     lat: 34.0522,
//     lng: -118.2437,
//     requiredCategory: 'real_estate',
//     requiredFeature: 'property_marketplace'
//   })
// })
//   .then(response => response.json())
//   .then(data => console.log(data))
//   .catch(error => console.error('Error:', error)); 
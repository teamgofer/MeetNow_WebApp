/**
 * Reverse Geocode API handler
 * Gets location information from coordinates
 * Uses Nominatim OpenStreetMap API
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/reverse';
const USER_AGENT = 'MeetNow-WebApp/1.0';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lat, lon, format = 'json' } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Both latitude and longitude are required' });
  }

  // Validate coordinates
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: 'Invalid coordinates provided' });
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Coordinates out of range' });
  }

  try {
    // Build the URL with query parameters
    const url = new URL(NOMINATIM_BASE_URL);
    url.searchParams.append('lat', latitude);
    url.searchParams.append('lon', longitude);
    url.searchParams.append('format', format);
    url.searchParams.append('addressdetails', '1');
    url.searchParams.append('namedetails', '1');
    url.searchParams.append('zoom', '18'); // Higher zoom means more detailed information

    // Make the request to Nominatim API
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Reverse geocoding API error:', errorText);
      return res.status(response.status).json({ 
        error: `Reverse geocoding service error: ${response.statusText}` 
      });
    }

    const data = await response.json();

    // Transform the response data
    const result = {
      place_id: data.place_id,
      lat: parseFloat(data.lat),
      lon: parseFloat(data.lon),
      display_name: data.display_name,
      name: data.namedetails?.name || data.address?.road || data.address?.neighbourhood,
      type: data.type,
      address: data.address,
    };

    // Return the result
    return res.status(200).json(result);
  } catch (error) {
    console.error('Reverse geocoding API error:', error);
    
    return res.status(500).json({
      error: 'Failed to get location information',
      message: error instanceof Error ? error.message : String(error),
    });
  }
} 
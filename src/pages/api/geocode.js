/**
 * Geocode API handler
 * Searches for locations based on a query string
 * Uses Nominatim OpenStreetMap API
 */

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'MeetNow-WebApp/1.0';

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query, limit = 10, format = 'json' } = req.query;

  if (!query || query.length < 3) {
    return res.status(400).json({ error: 'Search query must be at least 3 characters' });
  }

  try {
    // Build the URL with query parameters
    const url = new URL(NOMINATIM_BASE_URL);
    url.searchParams.append('q', query);
    url.searchParams.append('format', format);
    url.searchParams.append('limit', limit);
    url.searchParams.append('addressdetails', '1');
    url.searchParams.append('namedetails', '1');
    url.searchParams.append('extratags', '0'); // Reduces response size

    // Make the request to Nominatim API
    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Geocoding API error:', errorText);
      return res.status(response.status).json({
        error: `Geocoding service error: ${response.statusText}`,
      });
    }

    const data = await response.json();

    // Transform the response data
    const results = data.map(item => ({
      place_id: item.place_id,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      display_name: item.display_name,
      name: item.namedetails?.name || item.address?.road || item.address?.neighbourhood,
      type: item.type,
      importance: item.importance,
      address: item.address,
    }));

    // Return the results
    return res.status(200).json({
      results,
      query,
      count: results.length,
    });
  } catch (error) {
    console.error('Geocoding API error:', error);

    return res.status(500).json({
      error: 'Failed to search locations',
      message: error.message,
    });
  }
}

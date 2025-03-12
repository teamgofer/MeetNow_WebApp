const NOMINATIM_ENDPOINT = 'https://nominatim.openstreetmap.org';

export const searchLocations = async (query, { lat, lng } = {}) => {
  try {
    // Add delay between requests to respect Nominatim's usage policy
    await new Promise(resolve => setTimeout(resolve, 1000));

    let url;
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'MeetNow App/1.0'
    };

    if (query) {
      // Forward geocoding (search by text)
      url = `${NOMINATIM_ENDPOINT}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    } else if (lat && lng) {
      // Reverse geocoding (search by coordinates)
      url = `${NOMINATIM_ENDPOINT}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    } else {
      throw new Error('Either query or coordinates must be provided');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data) {
        throw new Error('No results found');
      }

      // Transform Nominatim response to match our format
      if (query) {
        // Handle forward geocoding results (array)
        return data.map(feature => ({
          place_id: feature.place_id,
          display_name: formatAddress(feature.address) || feature.display_name,
          lat: parseFloat(feature.lat),
          lon: parseFloat(feature.lon),
          address: feature.address
        }));
      } else {
        // Handle reverse geocoding result (single object)
        return [{
          place_id: data.place_id,
          display_name: formatAddress(data.address) || data.display_name,
          lat: parseFloat(data.lat),
          lon: parseFloat(data.lon),
          address: data.address
        }];
      }
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Location search error:', error);
    if (error.name === 'AbortError') {
      throw new Error('Location search timed out. Please try again.');
    }
    throw new Error(error.message || 'Failed to search location');
  }
};

const formatAddress = (address) => {
  if (!address) return '';

  const components = [];
  
  // Add house number and street
  if (address.house_number || address.road) {
    const street = [address.house_number, address.road].filter(Boolean).join(' ');
    if (street) components.push(street);
  }

  // Add neighborhood or suburb
  if (address.suburb || address.neighbourhood) {
    components.push(address.suburb || address.neighbourhood);
  }

  // Add city/town/village
  const city = address.city || address.town || address.village;
  if (city) components.push(city);

  // Add state/province
  if (address.state) components.push(address.state);

  // Add country
  if (address.country) components.push(address.country);

  return components.join(', ');
}; 
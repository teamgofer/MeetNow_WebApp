interface LocationResult {
  lat: string;
  lon: string;
  display_name: string;
}

export async function searchLocations(query: string): Promise<LocationResult[]> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
    );
    
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.map((item: any) => ({
      lat: item.lat,
      lon: item.lon,
      display_name: item.display_name
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
} 
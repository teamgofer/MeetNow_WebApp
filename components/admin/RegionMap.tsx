import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for Leaflet's default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Create custom icons
const createMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 12px; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

type Region = {
  id: string;
  region_name: string;
  country_code: string;
  state_province?: string;
  city_name?: string;
  latitude?: number;
  longitude?: number;
  radius_km: number;
  is_active: boolean;
  rollout_phase: number;
  features: any;
};

type RegionMapProps = {
  regions: Region[];
  selectedRegion: Region | null;
  onRegionSelect: (region: Region) => void;
};

// Component to center map on selected region
const MapUpdater = ({ selectedRegion }: { selectedRegion: Region | null }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedRegion && selectedRegion.latitude && selectedRegion.longitude) {
      map.setView(
        [selectedRegion.latitude, selectedRegion.longitude],
        10 // zoom level
      );
    }
  }, [selectedRegion, map]);
  
  return null;
};

const RegionMap: React.FC<RegionMapProps> = ({ regions, selectedRegion, onRegionSelect }) => {
  const [mapCenter, setMapCenter] = useState<[number, number]>([34.0522, -118.2437]); // Default to LA
  const [mapZoom, setMapZoom] = useState(5);
  
  // Get phase colors
  const getPhaseColor = (phase: number, isActive: boolean): string => {
    if (!isActive) return '#9ca3af'; // gray-400
    
    switch (phase) {
      case 0: return '#818cf8'; // indigo-400 (global)
      case 1: return '#34d399'; // emerald-400 (phase 1)
      case 2: return '#fbbf24'; // amber-400 (phase 2)
      case 3: return '#f87171'; // red-400 (phase 3)
      default: return '#c084fc'; // purple-400 (future phases)
    }
  };
  
  // Set initial center based on regions
  useEffect(() => {
    // Find active phase 1 regions
    const activeRegions = regions.filter(r => r.is_active && r.rollout_phase === 1);
    
    if (activeRegions.length > 0) {
      // Find a region with valid coordinates
      const regionWithCoords = activeRegions.find(r => r.latitude && r.longitude);
      
      if (regionWithCoords && regionWithCoords.latitude && regionWithCoords.longitude) {
        setMapCenter([regionWithCoords.latitude, regionWithCoords.longitude]);
        setMapZoom(6);
      }
    }
  }, [regions]);
  
  return (
    <MapContainer 
      center={mapCenter} 
      zoom={mapZoom} 
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Map updater to center on selected region */}
      <MapUpdater selectedRegion={selectedRegion} />
      
      {/* Render regions with circles for radius */}
      {regions.map(region => {
        // Skip regions without coordinates (e.g. global default)
        if (!region.latitude || !region.longitude) return null;
        
        const isSelected = selectedRegion?.id === region.id;
        const phaseColor = getPhaseColor(region.rollout_phase, region.is_active);
        const icon = createMarkerIcon(phaseColor);
        
        return (
          <React.Fragment key={region.id}>
            {/* Coverage radius circle */}
            <Circle 
              center={[region.latitude, region.longitude]}
              radius={region.radius_km * 1000} // Convert km to meters
              pathOptions={{
                color: phaseColor,
                fillColor: phaseColor,
                fillOpacity: 0.1,
                weight: isSelected ? 3 : 1,
                opacity: isSelected ? 0.8 : 0.5,
              }}
              eventHandlers={{
                click: () => onRegionSelect(region)
              }}
            />
            
            {/* Center marker */}
            <Marker 
              position={[region.latitude, region.longitude]} 
              icon={icon}
              eventHandlers={{
                click: () => onRegionSelect(region)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <h3 className="font-medium">{region.region_name}</h3>
                  <p className="text-xs text-gray-500">
                    Phase {region.rollout_phase} • {region.radius_km} km radius
                  </p>
                  <p className="text-xs mt-1">
                    {region.is_active ? 
                      <span className="text-green-600">Active</span> : 
                      <span className="text-gray-500">Inactive</span>
                    }
                  </p>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </MapContainer>
  );
};

export default RegionMap; 
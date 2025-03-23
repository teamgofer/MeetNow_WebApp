'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import DensityFactorDisplay from '@/components/property/DensityFactorDisplay';

export default function PropertyExplorerPage() {
  const [cityStats, setCityStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadCityStats() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('city_average_density')
          .select('*')
          .order('avg_density', { ascending: false });
          
        if (error) throw error;
        setCityStats(data || []);
      } catch (err) {
        console.error('Error loading city stats:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadCityStats();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">MeetNow Property Explorer</h1>
      
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Population Density Impact</h2>
        <p className="mb-6">
          Property values in MeetNow are influenced by real-world population density. 
          Dense urban areas command premium values, while less populated regions are more affordable.
        </p>
        
        {isLoading ? (
          <p>Loading city statistics...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {cityStats.map((city) => (
              <div key={city.city} className="bg-card p-4 rounded-lg shadow">
                <h3 className="font-medium text-lg">{city.city}</h3>
                <p className="text-sm text-muted-foreground">Average density: {Math.round(city.avg_density)} people/km²</p>
                <p className="text-sm text-muted-foreground">{city.neighborhood_count} neighborhoods</p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Property Listings</h2>
        <p className="mb-6">
          Browse available properties and see how population density affects their value.
          Properties in high-density areas can be worth up to 2x more than their base value.
        </p>
        
        <DensityFactorDisplay />
      </div>
    </div>
  );
} 
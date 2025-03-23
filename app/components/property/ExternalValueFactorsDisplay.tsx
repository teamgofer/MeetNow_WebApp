import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

interface PropertyWithFactors {
  id: string;
  name: string;
  city: string;
  base_value: number;
  current_value: number;
  factors: {
    overall: number;
    density: {
      value: number;
      factor: number;
      source: string;
    };
    pointsOfInterest: {
      value: number;
      factor: number;
      source: string;
    };
    trending: {
      value: number;
      factor: number;
      source: string;
    };
  };
}

export default function ExternalValueFactorsDisplay() {
  const [properties, setProperties] = useState<PropertyWithFactors[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPropertiesWithFactors() {
      try {
        setLoading(true);
        
        // Fetch properties with their external data factors
        const { data, error } = await supabase
          .from('virtual_properties')
          .select(`
            id, 
            name, 
            city, 
            base_value, 
            current_value,
            property_value_factors!inner (
              factor_type,
              factor_value,
              external_data_sources
            )
          `)
          .eq('property_value_factors.factor_type', 'external_metrics')
          .order('current_value', { ascending: false });
        
        if (error) throw error;
        
        // Format the data for display
        const formattedData = data.map(property => ({
          id: property.id,
          name: property.name,
          city: property.city,
          base_value: property.base_value,
          current_value: property.current_value,
          factors: {
            overall: property.property_value_factors?.factor_value || 1.0,
            density: property.property_value_factors?.external_data_sources?.density || {
              value: 0,
              factor: 1.0,
              source: 'unknown'
            },
            pointsOfInterest: property.property_value_factors?.external_data_sources?.pointsOfInterest || {
              value: 0,
              factor: 1.0,
              source: 'unknown'
            },
            trending: property.property_value_factors?.external_data_sources?.trending || {
              value: 0,
              factor: 1.0,
              source: 'unknown'
            }
          }
        }));

        setProperties(formattedData);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load property data');
      } finally {
        setLoading(false);
      }
    }

    fetchPropertiesWithFactors();
  }, []);

  // Get color based on factor value
  const getFactorColor = (factor: number) => {
    if (factor >= 1.5) return 'bg-emerald-500';
    if (factor >= 1.2) return 'bg-green-500';
    if (factor >= 1.0) return 'bg-blue-500';
    if (factor >= 0.9) return 'bg-yellow-500';
    return 'bg-amber-500';
  };

  // Calculate percentage for progress bar (0.8 to 2.0 maps to 0-100%)
  const calculateProgressPercentage = (factor: number) => {
    return Math.round(((factor - 0.8) / 1.2) * 100);
  };

  if (loading) return <div className="text-center py-8">Loading property data...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (properties.length === 0) return <div className="text-center py-8">No properties with external data found.</div>;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {properties.map(property => (
          <div key={property.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg font-medium">{property.name}</h3>
              <div className="text-sm text-gray-600">{property.city}</div>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Overall value */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Overall Value</span>
                  <span className="font-semibold">{property.current_value} credits</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Base: {property.base_value}</span>
                  <span>Multiplier: {property.factors.overall.toFixed(2)}x</span>
                </div>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Value Factors</div>
                
                {/* Population Density */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-sm">
                    <span>Population Density</span>
                    <span className="font-medium">{property.factors.density.factor.toFixed(2)}x</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div 
                      className={`h-full ${getFactorColor(property.factors.density.factor)}`} 
                      style={{ width: `${calculateProgressPercentage(property.factors.density.factor)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Source: {property.factors.density.source}
                  </div>
                </div>
                
                {/* Points of Interest */}
                <div className="space-y-1 mb-3">
                  <div className="flex justify-between text-sm">
                    <span>Points of Interest</span>
                    <span className="font-medium">{property.factors.pointsOfInterest.factor.toFixed(2)}x</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div 
                      className={`h-full ${getFactorColor(property.factors.pointsOfInterest.factor)}`} 
                      style={{ width: `${calculateProgressPercentage(property.factors.pointsOfInterest.factor)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Source: {property.factors.pointsOfInterest.source}
                  </div>
                </div>
                
                {/* Social Trending */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Social Trending</span>
                    <span className="font-medium">{property.factors.trending.factor.toFixed(2)}x</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div 
                      className={`h-full ${getFactorColor(property.factors.trending.factor)}`} 
                      style={{ width: `${calculateProgressPercentage(property.factors.trending.factor)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    Source: {property.factors.trending.source}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-blue-50 p-4 rounded-lg text-sm">
        <h4 className="font-medium text-blue-800 mb-2">About External Data Sources</h4>
        <p className="text-blue-700 mb-2">
          Property values are dynamically calculated using real-world data from external sources:
        </p>
        <ul className="list-disc pl-5 text-blue-700 space-y-1">
          <li>Population density affects property value by up to ±50%</li>
          <li>Nearby points of interest can increase value by up to 50%</li>
          <li>Social media trending data can boost value by up to 30%</li>
        </ul>
      </div>
    </div>
  );
} 
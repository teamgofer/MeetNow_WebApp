import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface PropertyWithDensity {
  id: string;
  name: string;
  city: string;
  base_value: number;
  current_value: number;
  density_factor: number | null;
}

export default function DensityFactorDisplay() {
  const [properties, setProperties] = useState<PropertyWithDensity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPropertiesWithDensity() {
      try {
        setLoading(true);
        // Fetch properties with their density factors
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
              population_density_factor
            )
          `)
          .eq('property_value_factors.factor_type', 'population_density')
          .order('current_value', { ascending: false });
        
        if (error) throw error;

        // Format the data
        const formattedData = data.map(property => ({
          id: property.id,
          name: property.name,
          city: property.city,
          base_value: property.base_value,
          current_value: property.current_value,
          density_factor: property.property_value_factors?.population_density_factor || null
        }));

        setProperties(formattedData);
      } catch (err) {
        console.error('Error fetching properties:', err);
        setError('Failed to load property data');
      } finally {
        setLoading(false);
      }
    }

    fetchPropertiesWithDensity();
  }, []);

  // Function to determine color based on density factor
  const getDensityColor = (factor: number | null) => {
    if (!factor) return 'bg-gray-400';
    if (factor >= 1.5) return 'bg-emerald-500';
    if (factor >= 1.0) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  // Calculate percentage for progress bar (0.8 to 2.0 maps to 0-100%)
  const calculateProgressPercentage = (factor: number | null) => {
    if (!factor) return 0;
    // Map from 0.8-2.0 range to 0-100%
    return Math.round(((factor - 0.8) / 1.2) * 100);
  };

  if (loading) return <div className="text-center py-8">Loading property data...</div>;
  if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
  if (properties.length === 0) return <div className="text-center py-8">No properties with density data found.</div>;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {properties.map(property => (
        <Card key={property.id} className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">{property.name}</CardTitle>
            <div className="text-sm text-muted-foreground">{property.city}</div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Base Value</span>
                <span className="font-semibold">{property.base_value} credits</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Population Density Factor</span>
                  <span className="font-semibold">{property.density_factor?.toFixed(2) || 'N/A'}</span>
                </div>
                <Progress 
                  value={calculateProgressPercentage(property.density_factor)} 
                  className={`h-2 ${getDensityColor(property.density_factor)}`} 
                />
              </div>
              
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Current Value</span>
                <span className="text-lg font-bold">{property.current_value} credits</span>
              </div>
              
              <div className="text-xs text-muted-foreground text-right">
                {property.density_factor && (
                  <>
                    Value modifier: {((property.density_factor - 1) * 100).toFixed(0)}% 
                    {property.density_factor > 1 ? ' increase' : ' decrease'}
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 
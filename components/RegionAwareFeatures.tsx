import React, { useEffect, useState } from 'react';
import { useSupabaseClient, useUser } from '@supabase/auth-helpers-react';
import { toast } from 'react-hot-toast';

type AvailableFeatures = {
  region_name: string;
  country_code: string;
  city_name?: string;
  features: {
    core: {
      enabled: boolean;
      features: string[];
    };
    real_estate?: {
      enabled: boolean;
      features?: string[];
    };
    [key: string]: any;
  };
};

type RegionAwareFeaturesProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredCategory: string;
  requiredFeature?: string;
};

const RegionAwareFeatures: React.FC<RegionAwareFeaturesProps> = ({
  children,
  fallback,
  requiredCategory,
  requiredFeature,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isFeatureAvailable, setIsFeatureAvailable] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [availableFeatures, setAvailableFeatures] = useState<AvailableFeatures | null>(null);
  
  const supabase = useSupabaseClient();
  const user = useUser();

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Unable to get your location. Some features may be unavailable.');
          setIsLoading(false);
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser. Some features may be unavailable.');
      setIsLoading(false);
    }
  }, []);

  // Check feature availability once we have the user's location
  useEffect(() => {
    if (!userLocation) return;

    const checkFeatureAvailability = async () => {
      try {
        const { data, error } = await supabase.rpc('get_available_features', {
          lat: userLocation.lat,
          lng: userLocation.lng,
        });

        if (error) throw error;
        
        setAvailableFeatures(data);
        
        // Check if the required feature category is available
        if (
          data?.features?.[requiredCategory]?.enabled === true &&
          (!requiredFeature || 
            (data?.features?.[requiredCategory]?.features?.includes(requiredFeature)))
        ) {
          setIsFeatureAvailable(true);
        } else {
          setIsFeatureAvailable(false);
        }
      } catch (error) {
        console.error('Error checking feature availability:', error);
        setIsFeatureAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkFeatureAvailability();
  }, [userLocation, requiredCategory, requiredFeature, supabase]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Feature is available, render children
  if (isFeatureAvailable) {
    return <>{children}</>;
  }

  // Feature is not available, render fallback or message
  return fallback ? (
    <>{fallback}</>
  ) : (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
      <h3 className="text-amber-800 font-semibold">Feature Not Available</h3>
      <p className="text-amber-700">
        {availableFeatures?.city_name 
          ? `This feature is not yet available in ${availableFeatures.city_name}.`
          : 'This feature is not yet available in your current location.'}
      </p>
      {availableFeatures?.region_name !== 'Global Default' && (
        <p className="text-amber-700 mt-2">
          You're currently in the {availableFeatures?.region_name} region.
        </p>
      )}
    </div>
  );
};

export default RegionAwareFeatures;

// Example usage:
// <RegionAwareFeatures requiredCategory="real_estate" requiredFeature="property_marketplace">
//   <PropertyMarketplace />
// </RegionAwareFeatures> 
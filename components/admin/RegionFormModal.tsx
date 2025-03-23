import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

type Region = {
  id: string;
  region_name: string;
  country_code: string;
  state_province?: string;
  city_name?: string;
  latitude?: number;
  longitude?: number;
  radius_km: number;
  features: any;
  rollout_phase: number;
  is_active: boolean;
};

type RegionFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (region: Partial<Region>) => Promise<void>;
  region?: Region | null;
  isEditing: boolean;
};

const RegionFormModal: React.FC<RegionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  region,
  isEditing
}) => {
  const [formData, setFormData] = useState<Partial<Region>>({
    region_name: '',
    country_code: '',
    state_province: '',
    city_name: '',
    latitude: undefined,
    longitude: undefined,
    radius_km: 50,
    rollout_phase: 1,
    is_active: true,
    features: {
      core: {
        enabled: true,
        features: ["messaging", "events", "profiles", "groups"]
      },
      real_estate: {
        enabled: false
      }
    }
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [featuresString, setFeaturesString] = useState('');
  
  // Initialize form data when editing
  useEffect(() => {
    if (isEditing && region) {
      setFormData({
        id: region.id,
        region_name: region.region_name,
        country_code: region.country_code,
        state_province: region.state_province || '',
        city_name: region.city_name || '',
        latitude: region.latitude,
        longitude: region.longitude,
        radius_km: region.radius_km,
        rollout_phase: region.rollout_phase,
        is_active: region.is_active,
        features: region.features
      });
      
      setFeaturesString(JSON.stringify(region.features, null, 2));
    } else {
      // Reset form for new region
      setFormData({
        region_name: '',
        country_code: '',
        state_province: '',
        city_name: '',
        latitude: undefined,
        longitude: undefined,
        radius_km: 50,
        rollout_phase: 1,
        is_active: true,
        features: {
          core: {
            enabled: true,
            features: ["messaging", "events", "profiles", "groups"]
          },
          real_estate: {
            enabled: false
          }
        }
      });
      
      setFeaturesString(JSON.stringify({
        core: {
          enabled: true,
          features: ["messaging", "events", "profiles", "groups"]
        },
        real_estate: {
          enabled: false
        }
      }, null, 2));
    }
  }, [isEditing, region, isOpen]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'features') {
      setFeaturesString(value);
      try {
        const parsedFeatures = JSON.parse(value);
        setFormData(prev => ({
          ...prev,
          features: parsedFeatures
        }));
      } catch (error) {
        // Don't update features if JSON is invalid
        console.error('Invalid JSON:', error);
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : name === 'radius_km' || name === 'rollout_phase' || name === 'latitude' || name === 'longitude'
          ? value === '' ? undefined : Number(value)
          : value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Validate features JSON
      try {
        JSON.parse(featuresString);
      } catch (error) {
        toast.error('Invalid JSON in features field');
        setIsSubmitting(false);
        return;
      }
      
      // Save the region
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving region:', error);
      toast.error('Failed to save region');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-xl font-medium text-gray-900">
            {isEditing ? 'Edit Region' : 'Add New Region'}
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-4">Basic Information</h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="region_name" className="block text-sm font-medium text-gray-700">
                    Region Name *
                  </label>
                  <input
                    type="text"
                    id="region_name"
                    name="region_name"
                    value={formData.region_name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="country_code" className="block text-sm font-medium text-gray-700">
                    Country Code *
                  </label>
                  <input
                    type="text"
                    id="country_code"
                    name="country_code"
                    value={formData.country_code}
                    onChange={handleChange}
                    required
                    maxLength={2}
                    placeholder="US, CA, GB, etc."
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="state_province" className="block text-sm font-medium text-gray-700">
                    State/Province
                  </label>
                  <input
                    type="text"
                    id="state_province"
                    name="state_province"
                    value={formData.state_province}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="city_name" className="block text-sm font-medium text-gray-700">
                    City Name
                  </label>
                  <input
                    type="text"
                    id="city_name"
                    name="city_name"
                    value={formData.city_name}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-4">Geographic Information</h4>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    id="latitude"
                    name="latitude"
                    value={formData.latitude === undefined ? '' : formData.latitude}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    id="longitude"
                    name="longitude"
                    value={formData.longitude === undefined ? '' : formData.longitude}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="radius_km" className="block text-sm font-medium text-gray-700">
                    Radius (km)
                  </label>
                  <input
                    type="number"
                    min="0"
                    id="radius_km"
                    name="radius_km"
                    value={formData.radius_km === undefined ? '' : formData.radius_km}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="rollout_phase" className="block text-sm font-medium text-gray-700">
                    Rollout Phase
                  </label>
                  <select
                    id="rollout_phase"
                    name="rollout_phase"
                    value={formData.rollout_phase}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value={0}>Global (Phase 0)</option>
                    <option value={1}>Phase 1</option>
                    <option value={2}>Phase 2</option>
                    <option value={3}>Phase 3</option>
                    <option value={4}>Phase 4</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <h4 className="font-medium text-gray-700 mb-2">Features Configuration (JSON)</h4>
            <textarea
              id="features"
              name="features"
              rows={8}
              value={featuresString}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="mt-1 text-sm text-gray-500">
              Enter the features as a JSON object. Each feature category should have an "enabled" property.
            </p>
          </div>
          
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Region' : 'Create Region')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegionFormModal; 
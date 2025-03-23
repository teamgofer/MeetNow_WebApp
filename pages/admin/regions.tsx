import React, { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import dynamic from 'next/dynamic';
import { toast } from 'react-hot-toast';
import AdminLayout from '../../components/admin/AdminLayout';

// Import with no SSR since Leaflet requires browser APIs
const RegionMap = dynamic(() => import('../../components/admin/RegionMap'), { 
  ssr: false 
});

// Dynamically import the form modal to avoid SSR issues
const RegionFormModal = dynamic(() => import('../../components/admin/RegionFormModal'), {
  ssr: false
});

type Region = {
  id: string;
  region_name: string;
  country_code: string;
  state_province?: string;
  city_name?: string;
  coordinates?: any;
  radius_km: number;
  features: any;
  rollout_phase: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  latitude?: number;
  longitude?: number;
};

type FeatureRollout = {
  id: string;
  feature_name: string;
  rollout_phase: number;
  target_regions: string[];
  start_date: string;
  end_date: string;
  status: string;
};

const RegionManagement = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [rollouts, setRollouts] = useState<FeatureRollout[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('regions');
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  
  const supabase = useSupabaseClient();
  
  useEffect(() => {
    checkAdminStatus();
    fetchRegions();
    fetchRollouts();
  }, []);
  
  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setIsAdmin(false);
      return;
    }
    
    // Fetch user's role from profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
      return;
    }
    
    setIsAdmin(data?.role === 'admin');
  };
  
  const fetchRegions = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from('supported_regions')
      .select('*')
      .order('rollout_phase', { ascending: true })
      .order('region_name', { ascending: true });
      
    if (error) {
      console.error('Error fetching regions:', error);
      toast.error('Failed to load regions');
      setLoading(false);
      return;
    }
    
    // Format the coordinates for display
    const formattedRegions = data.map(region => {
      // For non-global regions, extract lat/lng from coordinates
      if (region.coordinates) {
        const point = region.coordinates;
        const match = point.match(/POINT\(([^ ]+) ([^)]+)\)/);
        
        if (match) {
          return {
            ...region,
            longitude: parseFloat(match[1]),
            latitude: parseFloat(match[2])
          };
        }
      }
      
      return region;
    });
    
    setRegions(formattedRegions);
    setLoading(false);
  };
  
  const fetchRollouts = async () => {
    const { data, error } = await supabase
      .from('feature_rollout_schedule')
      .select('*')
      .order('start_date', { ascending: true });
      
    if (error) {
      console.error('Error fetching rollouts:', error);
      toast.error('Failed to load rollout schedule');
      return;
    }
    
    setRollouts(data);
  };
  
  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
  };
  
  const toggleRegionActive = async (region: Region) => {
    if (!isAdmin) {
      toast.error('You need admin privileges to modify regions');
      return;
    }
    
    const { data, error } = await supabase
      .from('supported_regions')
      .update({ is_active: !region.is_active, updated_at: new Date().toISOString() })
      .eq('id', region.id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating region:', error);
      toast.error('Failed to update region status');
      return;
    }
    
    toast.success(`${region.region_name} is now ${data.is_active ? 'active' : 'inactive'}`);
    
    // Update local state
    setRegions(regions.map(r => r.id === region.id ? { ...r, is_active: !r.is_active } : r));
    
    if (selectedRegion?.id === region.id) {
      setSelectedRegion({ ...selectedRegion, is_active: !selectedRegion.is_active });
    }
  };
  
  const updateFeature = async (regionId: string, featureCategory: string, enabled: boolean) => {
    if (!isAdmin) {
      toast.error('You need admin privileges to modify features');
      return;
    }
    
    // Get the current region to update its features
    const region = regions.find(r => r.id === regionId);
    if (!region) return;
    
    // Create a copy of the features object
    const updatedFeatures = { ...region.features };
    
    // Update the enabled status
    if (updatedFeatures[featureCategory]) {
      updatedFeatures[featureCategory].enabled = enabled;
    } else {
      updatedFeatures[featureCategory] = { enabled };
    }
    
    const { error } = await supabase
      .from('supported_regions')
      .update({ 
        features: updatedFeatures,
        updated_at: new Date().toISOString()
      })
      .eq('id', regionId);
      
    if (error) {
      console.error('Error updating feature:', error);
      toast.error('Failed to update feature status');
      return;
    }
    
    toast.success(`${featureCategory} is now ${enabled ? 'enabled' : 'disabled'} for ${region.region_name}`);
    
    // Update local state
    setRegions(regions.map(r => {
      if (r.id === regionId) {
        return { ...r, features: updatedFeatures };
      }
      return r;
    }));
    
    if (selectedRegion?.id === regionId) {
      setSelectedRegion({ ...selectedRegion, features: updatedFeatures });
    }
  };

  const handleAddRegion = () => {
    setIsEditing(false);
    setSelectedRegion(null);
    setShowModal(true);
  };

  const handleEditRegion = (region: Region) => {
    setSelectedRegion(region);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleSaveRegion = async (region: Partial<Region>) => {
    if (!isAdmin) {
      toast.error('You need admin privileges to modify regions');
      return;
    }

    try {
      if (isEditing && selectedRegion) {
        // Update existing region
        const { data, error } = await supabase
          .from('supported_regions')
          .update({
            region_name: region.region_name,
            country_code: region.country_code,
            state_province: region.state_province || null,
            city_name: region.city_name || null,
            coordinates: (region.latitude && region.longitude) 
              ? `POINT(${region.longitude} ${region.latitude})` 
              : null,
            radius_km: region.radius_km,
            features: region.features,
            rollout_phase: region.rollout_phase,
            is_active: region.is_active,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedRegion.id)
          .select()
          .single();

        if (error) throw error;
        
        toast.success(`Region ${data.region_name} updated successfully`);
        
        // Update local state
        setRegions(regions.map(r => r.id === selectedRegion.id ? {
          ...data,
          latitude: region.latitude,
          longitude: region.longitude
        } : r));
        
        setSelectedRegion(null);
      } else {
        // Create new region
        const { data, error } = await supabase
          .from('supported_regions')
          .insert({
            region_name: region.region_name,
            country_code: region.country_code,
            state_province: region.state_province || null,
            city_name: region.city_name || null,
            coordinates: (region.latitude && region.longitude) 
              ? `POINT(${region.longitude} ${region.latitude})` 
              : null,
            radius_km: region.radius_km,
            features: region.features,
            rollout_phase: region.rollout_phase,
            is_active: region.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        
        toast.success(`Region ${data.region_name} created successfully`);
        
        // Update local state with the new region
        setRegions([...regions, {
          ...data,
          latitude: region.latitude,
          longitude: region.longitude
        }]);
      }
      
      setShowModal(false);
    } catch (error) {
      console.error('Error saving region:', error);
      toast.error('Failed to save region');
    }
  };
  
  const renderRegionsTab = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 bg-white shadow rounded-lg">
        <div className="h-[600px] rounded-lg overflow-hidden">
          <RegionMap 
            regions={regions} 
            selectedRegion={selectedRegion}
            onRegionSelect={handleRegionSelect}
          />
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Regions</h3>
          <button
            onClick={handleAddRegion}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Region
          </button>
        </div>
        
        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {regions.map(region => (
            <div 
              key={region.id} 
              className={`p-3 rounded-lg cursor-pointer ${
                selectedRegion?.id === region.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => handleRegionSelect(region)}
            >
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">{region.region_name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  region.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {region.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="text-sm text-gray-500 mt-1">
                {region.country_code}
                {region.state_province && `, ${region.state_province}`}
                {region.city_name && `, ${region.city_name}`}
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                Phase {region.rollout_phase}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {selectedRegion && (
        <div className="lg:col-span-3 bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-medium text-gray-900">
              {selectedRegion.region_name} Details
            </h3>
            
            <div className="flex space-x-2">
              <button
                onClick={() => toggleRegionActive(selectedRegion)}
                className={`px-3 py-1 text-sm rounded-md ${
                  selectedRegion.is_active
                    ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                {selectedRegion.is_active ? 'Deactivate' : 'Activate'}
              </button>
              
              <button
                onClick={() => handleEditRegion(selectedRegion)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200"
              >
                Edit Region
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Region Information</h4>
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500">Country:</span>
                  <span className="col-span-2">{selectedRegion.country_code}</span>
                </div>
                
                {selectedRegion.state_province && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">State/Province:</span>
                    <span className="col-span-2">{selectedRegion.state_province}</span>
                  </div>
                )}
                
                {selectedRegion.city_name && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">City:</span>
                    <span className="col-span-2">{selectedRegion.city_name}</span>
                  </div>
                )}
                
                {selectedRegion.coordinates && (
                  <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Coordinates:</span>
                    <span className="col-span-2">
                      {selectedRegion.latitude?.toFixed(4)}, {selectedRegion.longitude?.toFixed(4)}
                    </span>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500">Radius:</span>
                  <span className="col-span-2">{selectedRegion.radius_km} km</span>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <span className="text-gray-500">Rollout Phase:</span>
                  <span className="col-span-2">{selectedRegion.rollout_phase}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Feature Availability</h4>
              <div className="bg-gray-50 p-4 rounded-md">
                {Object.entries(selectedRegion.features || {}).map(([category, config]) => (
                  <div key={category} className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium capitalize">{category.replace('_', ' ')}</h5>
                      
                      <button
                        onClick={() => updateFeature(
                          selectedRegion.id, 
                          category, 
                          !(config as any).enabled
                        )}
                        className={`px-2 py-1 text-xs rounded-full ${
                          (config as any).enabled
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {(config as any).enabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                    
                    {(config as any).features && (
                      <div className="pl-2 border-l-2 border-gray-200">
                        <h6 className="text-xs text-gray-500 mb-1">Included Features:</h6>
                        <div className="flex flex-wrap gap-1">
                          {((config as any).features as string[]).map(feature => (
                            <span 
                              key={feature} 
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                            >
                              {feature.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Region Form Modal */}
      <RegionFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveRegion}
        region={selectedRegion}
        isEditing={isEditing}
      />
    </div>
  );
  
  const renderRolloutsTab = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-medium text-gray-900">Feature Rollout Schedule</h3>
        
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Schedule New Rollout
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Feature
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phase
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target Regions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Start Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                End Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rollouts.map(rollout => (
              <tr key={rollout.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 capitalize">
                    {rollout.feature_name.replace('_', ' ')}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    Phase {rollout.rollout_phase}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {rollout.target_regions.map((region, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                      >
                        {region}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(rollout.start_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">
                    {new Date(rollout.end_date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    rollout.status === 'planned'
                      ? 'bg-blue-100 text-blue-800'
                      : rollout.status === 'in-progress'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {rollout.status.replace('-', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-900">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  if (!isAdmin) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
            <p className="text-gray-700 mb-6">
              You don't have permission to access this page. Please contact an administrator
              if you believe this is an error.
            </p>
            <a
              href="/"
              className="w-full block text-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Return to Home
            </a>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-1">Region Management</h2>
        <p className="text-gray-600 mb-6">
          Manage geographic regions and feature availability across the platform
        </p>
        
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'regions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('regions')}
          >
            Geographic Regions
          </button>
          <button
            className={`py-3 px-6 border-b-2 font-medium text-sm ${
              activeTab === 'rollouts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('rollouts')}
          >
            Feature Rollouts
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {activeTab === 'regions' && renderRegionsTab()}
            {activeTab === 'rollouts' && renderRolloutsTab()}
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default RegionManagement; 
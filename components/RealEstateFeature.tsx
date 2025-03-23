import React from 'react';
import RegionAwareFeatures from './RegionAwareFeatures';

type PropertyListingType = {
  id: string;
  name: string;
  location: string;
  price: number;
  description: string;
  imageUrl: string;
};

const RealEstateMarketplace: React.FC = () => {
  // Mock property data - in a real app this would come from your database
  const featuredProperties: PropertyListingType[] = [
    {
      id: '1',
      name: 'Downtown Penthouse',
      location: 'Los Angeles, CA',
      price: 5000,
      description: 'Luxury virtual penthouse with panoramic views of downtown LA',
      imageUrl: '/images/properties/property-1.jpg'
    },
    {
      id: '2',
      name: 'Beach House',
      location: 'San Diego, CA',
      price: 4200,
      description: 'Beachfront property with direct access to virtual surfing spots',
      imageUrl: '/images/properties/property-2.jpg'
    },
    {
      id: '3',
      name: 'Tech Hub Office',
      location: 'San Francisco, CA',
      price: 7500,
      description: 'Modern office space in the heart of the virtual tech district',
      imageUrl: '/images/properties/property-3.jpg'
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Virtual Property Marketplace
      </h2>
      <p className="mt-4 text-lg text-gray-500">
        Buy, sell, and rent virtual properties in prime locations.
      </p>

      <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {featuredProperties.map((property) => (
          <div key={property.id} className="flex flex-col overflow-hidden rounded-lg shadow-lg">
            <div className="flex-shrink-0">
              <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                {property.imageUrl ? (
                  <img
                    className="h-full w-full object-cover"
                    src={property.imageUrl}
                    alt={property.name}
                  />
                ) : (
                  <div className="text-gray-400">Image not available</div>
                )}
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between bg-white p-6">
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600">
                    {property.location}
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {property.price} credits
                  </p>
                </div>
                <a href={`/property/${property.id}`} className="mt-2 block">
                  <p className="text-xl font-semibold text-gray-900">{property.name}</p>
                  <p className="mt-3 text-base text-gray-500">{property.description}</p>
                </a>
              </div>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                >
                  View Property
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// The RealEstateFeature component wraps the marketplace in the RegionAwareFeatures component
const RealEstateFeature: React.FC = () => {
  return (
    <RegionAwareFeatures 
      requiredCategory="real_estate" 
      requiredFeature="property_marketplace"
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900">
            Coming Soon to Your Area!
          </h3>
          <p className="mt-4 text-lg text-gray-500">
            Our virtual property marketplace is currently available in select California cities.
            We're expanding to new locations soon!
          </p>
          <button
            type="button"
            className="mt-8 inline-flex items-center rounded-md bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Get Notified When Available
          </button>
        </div>
      }
    >
      <RealEstateMarketplace />
    </RegionAwareFeatures>
  );
};

export default RealEstateFeature; 